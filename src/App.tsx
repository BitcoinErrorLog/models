import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  SECURITY_ZONES,
  cMax,
  classifySecurityZone,
  defaultCoinbaseWeight,
  effectiveCapacity,
  leadTimeBlocks,
  nMax,
} from './lib/math'
import { SCENARIOS, scenarioEffectiveWeight, scenarioFromQueryString, scenarioToQueryString } from './lib/scenarios'
import type { Scenario } from './lib/scenarios'

type ToyState = {
  rho: number
  windowBlocks: number
  perUserWeight: number
  wCoinbase: number
}

const defaultScenario = SCENARIOS[0]

const scenarioToState = (scenario: Scenario): ToyState => ({
  rho: scenario.rho,
  windowBlocks: scenario.windowBlocks,
  perUserWeight: scenarioEffectiveWeight(scenario),
  wCoinbase: scenario.wCoinbase ?? defaultCoinbaseWeight,
})

const buildCustomScenario = (state: ToyState): Scenario => ({
  id: 'custom',
  name: 'Custom inputs',
  description: 'Your manually tuned parameters',
  rho: state.rho,
  windowBlocks: state.windowBlocks,
  wCoinbase: state.wCoinbase,
  cohorts: [
    {
      id: 'custom-cohort',
      label: 'Custom',
      perUserWeight: state.perUserWeight,
      share: 1,
    },
  ],
})

const horizonBlocks = [72, 137, 200, 432, 720, 1_008, 2_016]

const numberFormatter = new Intl.NumberFormat('en-US')

const zoneCopy: Record<string, string> = {
  safe: 'Safe (Zone 1)',
  probabilistic: 'Probabilistic (Zone 2)',
  insolvent: 'Insolvent (Zone 3)',
}

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

const Chart = ({ points }: { points: { windowBlocks: number; maxUsers: number }[] }) => {
  const width = 640
  const height = 260
  const padding = 32
  const maxX = Math.max(...points.map((p) => p.windowBlocks), 1)
  const maxY = Math.max(...points.map((p) => p.maxUsers), 1)
  const pathD = points
    .map((point, index) => {
      const x = padding + (point.windowBlocks / maxX) * (width - 2 * padding)
      const y = height - padding - (point.maxUsers / maxY) * (height - 2 * padding)
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="N_max across windows">
      <path d={pathD} fill="none" stroke="#2563eb" strokeWidth={3} strokeLinecap="round" />
      {points.map((point) => {
        const x = padding + (point.windowBlocks / maxX) * (width - 2 * padding)
        const y = height - padding - (point.maxUsers / maxY) * (height - 2 * padding)
        return <circle key={point.windowBlocks} cx={x} cy={y} r={5} fill="#2563eb" />
      })}
      <text x={padding} y={20} className="sparkline-label">
        N_max vs. window W'
      </text>
    </svg>
  )
}

function App() {
  const [state, setState] = useState<ToyState>(() => scenarioToState(defaultScenario))
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(defaultScenario.id)
  const [shareStatus, setShareStatus] = useState<string>('')

  useEffect(() => {
    const parsed = scenarioFromQueryString(window.location.search)
    if (parsed) {
      setState(scenarioToState(parsed))
      setSelectedScenarioId(parsed.id ?? 'custom')
    }
  }, [])

  const selectedScenario = SCENARIOS.find((scenario) => scenario.id === selectedScenarioId)

  const { rho, windowBlocks, perUserWeight, wCoinbase } = state

  const stats = useMemo(() => {
    const totalCapacity = cMax(windowBlocks, wCoinbase)
    const usableCapacity = effectiveCapacity(rho, windowBlocks, wCoinbase)
    const maxUsers = nMax(rho, windowBlocks, perUserWeight, wCoinbase)
    const zone = classifySecurityZone(maxUsers)
    const avgPerBlockCapacity = Math.max(0, (totalCapacity / Math.max(windowBlocks, 1)) || 0)
    const sampleDemand = 50_000
    const minLeadTime = leadTimeBlocks(sampleDemand, perUserWeight, rho, avgPerBlockCapacity)
    return {
      totalCapacity,
      usableCapacity,
      maxUsers,
      zone,
      avgPerBlockCapacity,
      sampleDemand,
      minLeadTime,
    }
  }, [rho, windowBlocks, perUserWeight, wCoinbase])

  const chartPoints = useMemo(
    () =>
      horizonBlocks.map((blocks) => ({
        windowBlocks: blocks,
        maxUsers: nMax(rho, blocks, perUserWeight, wCoinbase),
      })),
    [rho, perUserWeight, wCoinbase],
  )

  const scenarioForPersistence =
    selectedScenarioId === 'custom'
      ? buildCustomScenario(state)
      : selectedScenario ?? buildCustomScenario(state)

  const applyScenario = (scenario: Scenario) => {
    setState(scenarioToState(scenario))
    setSelectedScenarioId(scenario.id)
    setShareStatus('')
    const query = scenarioToQueryString(scenario)
    window.history.replaceState(null, '', `?${query}`)
  }

  const updateCustomState = (patch: Partial<ToyState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch }
      const customScenario = buildCustomScenario(next)
      const query = scenarioToQueryString(customScenario)
      window.history.replaceState(null, '', `?${query}`)
      return next
    })
    setSelectedScenarioId('custom')
    setShareStatus('')
  }

  const shareScenario = async () => {
    const query = scenarioToQueryString(scenarioForPersistence)
    const shareUrl = `${window.location.origin}${window.location.pathname}?${query}`
    await navigator.clipboard.writeText(shareUrl)
    setShareStatus('Link copied!')
    setTimeout(() => setShareStatus(''), 2_000)
  }

  const exportScenario = () => {
    const payload = {
      scenario: scenarioForPersistence,
      metrics: {
        nMax: stats.maxUsers,
        rho: rho,
        windowBlocks,
        perUserWeight,
      },
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `blockspace-toy-${scenarioForPersistence.id}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app">
      <header>
        <p className="eyebrow">Credible Exit Playground</p>
        <h1>Law of Conservation of Blockspace</h1>
        <p className="lede">
          Adjust the efficiency coefficient rho, usable window W', and per-user enforcement weight e
          to see the lower bound on simultaneous exits implied by the paper&apos;s byte accounting.
        </p>
      </header>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Presets &amp; Inputs</h2>
            <p>Select a published scenario or tweak the sliders to explore the design space.</p>
          </div>
          <div className="panel-actions">
            <button className="ghost" onClick={shareScenario}>
              Share current setup
            </button>
            <button className="ghost" onClick={exportScenario}>
              Download JSON
            </button>
          </div>
        </div>
        {shareStatus && <p className="share-status">{shareStatus}</p>}
        <div className="presets">
          {SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              className={selectedScenarioId === scenario.id ? 'preset active' : 'preset'}
              onClick={() => applyScenario(scenario)}
            >
              {scenario.name}
            </button>
          ))}
          <span className={selectedScenarioId === 'custom' ? 'preset active' : 'preset disabled'}>
            Custom
          </span>
        </div>

        <div className="controls-grid">
          <label className="control">
            <span>Efficiency coefficient rho</span>
            <div className="control-row">
              <input
                type="range"
                min={0.3}
                max={1}
                step={0.01}
                value={rho}
                onChange={(event) => updateCustomState({ rho: Number(event.target.value) })}
              />
              <input
                type="number"
                step={0.01}
                min={0}
                max={1}
                value={rho}
                onChange={(event) => updateCustomState({ rho: Number(event.target.value) })}
              />
            </div>
          </label>

          <label className="control">
            <span>Usable window W′ (blocks)</span>
            <input
              type="number"
              min={1}
              value={windowBlocks}
              onChange={(event) => updateCustomState({ windowBlocks: Number(event.target.value) })}
            />
            <small>≈ {(windowBlocks / 144).toFixed(1)} days</small>
          </label>

          <label className="control">
            <span>Per-user weight e (wu)</span>
            <input
              type="number"
              min={1}
              value={perUserWeight}
              onChange={(event) => updateCustomState({ perUserWeight: Number(event.target.value) })}
            />
            <small>Lightning idle ≈ 2,360 | active ≈ 4,616 | Ark ≈ 3,200</small>
          </label>

          <label className="control">
            <span>Coinbase overhead w_cb (wu)</span>
            <input
              type="number"
              min={0}
              value={wCoinbase}
              onChange={(event) => updateCustomState({ wCoinbase: Number(event.target.value) })}
            />
          </label>
        </div>
      </section>

      <section className="panel">
        <h2>Results</h2>
        <div className="metrics-grid">
          <article className="metric-card">
            <h3>N_max</h3>
            <p className="metric-value">{numberFormatter.format(stats.maxUsers)}</p>
            <p className="metric-hint">Simultaneous unilateral exits</p>
          </article>
          <article className="metric-card">
            <h3>rho·C_max (wu)</h3>
            <p className="metric-value">{numberFormatter.format(Math.round(stats.usableCapacity))}</p>
            <p className="metric-hint">
              of {numberFormatter.format(Math.round(stats.totalCapacity))} physical bytes
            </p>
          </article>
          <article className="metric-card">
            <h3>Security zone</h3>
            <p className="metric-value">{zoneCopy[stats.zone]}</p>
            <p className="metric-hint">
              Thresholds: ≤{numberFormatter.format(SECURITY_ZONES.safe)} safe / ≤
              {numberFormatter.format(SECURITY_ZONES.probabilistic)} probabilistic
            </p>
          </article>
          <article className="metric-card">
            <h3>Lead time for 50k exits</h3>
            <p className="metric-value">
              {stats.minLeadTime > 0 ? `${stats.minLeadTime.toFixed(1)} blocks` : '—'}
            </p>
            <p className="metric-hint">
              Using \\bar c = {numberFormatter.format(Math.round(stats.avgPerBlockCapacity))} wu
            </p>
          </article>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Window W' (blocks)</th>
                <th>Days</th>
                <th>N_max</th>
              </tr>
            </thead>
            <tbody>
              {chartPoints.map((point) => (
                <tr key={point.windowBlocks}>
                  <td>{numberFormatter.format(point.windowBlocks)}</td>
                  <td>{(point.windowBlocks / 144).toFixed(1)}</td>
                  <td>{numberFormatter.format(point.maxUsers)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Security slope visualized</h2>
        <Chart points={chartPoints} />
        <p className="chart-caption">
          Hovering near {percentFormatter.format(rho)} efficiency, scaling the usable window has a
          proportional effect on the maximum enforceable exits. Once the user count pushes into Zone
          3, no fee market dynamics can restore safety at this weight.
        </p>
        {selectedScenario && (
          <p className="scenario-note">
            <strong>{selectedScenario.name}:</strong> {selectedScenario.description}
          </p>
        )}
      </section>

      <section className="panel docs-panel">
        <h2>Operational notes</h2>
        <div className="docs-grid">
          <article>
            <h3>Estimating rho</h3>
            <ul>
              <li>
                Compute C_max = (4,000,000 - w_cb) · W' for the window you care about; w_cb defaults
                to 2,000 wu.
              </li>
              <li>
                Parse a mempool trace or block diff stream and sum the weight of replaced,
                orphaned, dusted, and policy-filtered transactions.
              </li>
              <li>
                Set rho = 1 - (loss terms / C_max). In the Oct 5, 2025 congestion window the losses
                totaled 160,200,000 wu, giving rho ≈ 0.71.
              </li>
            </ul>
          </article>
          <article>
            <h3>Lightning caveats</h3>
            <ul>
              <li>
                HTLC jamming raises e by forcing every channel into a high-h state, directly shrinking
                N_max even when rho and W' stay constant.
              </li>
              <li>
                Watchtowers and asynchronous monitors must still submit disputes on time; the toy
                assumes perfect relay, so real deployments should treat these figures as necessary
                but not sufficient conditions.
              </li>
            </ul>
          </article>
          <article>
            <h3>Model scope</h3>
            <ul>
              <li>
                This interface exposes a static capacity bound; it does not simulate queueing
                dynamics or fee auctions.
              </li>
              <li>
                Policy improvements (package relay, cluster mempool) mostly influence rho by reducing
                stranded bytes, but the conservation inequality still applies.
              </li>
            </ul>
          </article>
        </div>
      </section>
    </div>
  )
}

export default App
