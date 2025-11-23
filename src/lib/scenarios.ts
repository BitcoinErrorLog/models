import { blendedWeight, nMax } from './math'

export interface Cohort {
  id: string
  label: string
  perUserWeight: number
  share: number
}

export interface Scenario {
  id: string
  name: string
  description: string
  rho: number
  windowBlocks: number
  wCoinbase?: number
  cohorts: Cohort[]
}

export interface ScenarioMetrics {
  effectiveWeight: number
  maxUsers: number
}

export const LN_WEIGHTS = {
  idle: 2_360,
  active: 4_616,
} as const

export const ARK_WEIGHT = 3_200

export const SCENARIOS: Scenario[] = [
  {
    id: 'retail-panic',
    name: 'Retail Panic',
    description: '1-day window, active Lightning users under stress',
    rho: 0.8,
    windowBlocks: 137,
    cohorts: [
      {
        id: 'active',
        label: 'Active channels',
        perUserWeight: LN_WEIGHTS.active,
        share: 1,
      },
    ],
  },
  {
    id: 'quiet-exit',
    name: 'Quiet Exit',
    description: '1-day window, mostly idle Lightning users',
    rho: 0.8,
    windowBlocks: 137,
    cohorts: [
      {
        id: 'idle',
        label: 'Idle channels',
        perUserWeight: LN_WEIGHTS.idle,
        share: 1,
      },
    ],
  },
  {
    id: 'mixed-economy',
    name: 'Mixed Economy',
    description: '3-day window with 50/50 active-idle blend',
    rho: 0.8,
    windowBlocks: 432,
    cohorts: [
      { id: 'active', label: 'Active channels', perUserWeight: LN_WEIGHTS.active, share: 0.5 },
      { id: 'idle', label: 'Idle channels', perUserWeight: LN_WEIGHTS.idle, share: 0.5 },
    ],
  },
  {
    id: 'institutional',
    name: 'Institutional',
    description: '2-week window, active Lightning users',
    rho: 0.8,
    windowBlocks: 2_016,
    cohorts: [
      {
        id: 'active',
        label: 'Active channels',
        perUserWeight: LN_WEIGHTS.active,
        share: 1,
      },
    ],
  },
  {
    id: 'ark-week',
    name: 'Ark (1 Week)',
    description: 'Ark-style timeout tree with 1-week window',
    rho: 0.8,
    windowBlocks: 1_008,
    cohorts: [
      {
        id: 'ark-leaf',
        label: 'Per-user exit path',
        perUserWeight: ARK_WEIGHT,
        share: 1,
      },
    ],
  },
  {
    id: 'ark-fortnight',
    name: 'Ark (2 Weeks)',
    description: 'Ark-style timeout tree with 2-week window',
    rho: 0.8,
    windowBlocks: 2_016,
    cohorts: [
      {
        id: 'ark-leaf',
        label: 'Per-user exit path',
        perUserWeight: ARK_WEIGHT,
        share: 1,
      },
    ],
  },
]

export function scenarioEffectiveWeight(scenario: Scenario): number {
  if (scenario.cohorts.length === 1) {
    return scenario.cohorts[0].perUserWeight
  }
  return blendedWeight(
    scenario.cohorts.map((cohort) => ({
      weight: cohort.perUserWeight,
      share: cohort.share,
    })),
  )
}

export function scenarioMetrics(scenario: Scenario): ScenarioMetrics {
  const effectiveWeight = scenarioEffectiveWeight(scenario)
  const maxUsers = nMax(scenario.rho, scenario.windowBlocks, effectiveWeight, scenario.wCoinbase)
  return { effectiveWeight, maxUsers }
}

export const SCENARIO_QUERY_KEY = 'scenario'

export function encodeScenarioPayload(scenario: Scenario): string {
  return encodeURIComponent(JSON.stringify(scenario))
}

export function decodeScenarioPayload(payload: string): Scenario | null {
  try {
    return JSON.parse(decodeURIComponent(payload))
  } catch {
    return null
  }
}

export function scenarioToQueryString(scenario: Scenario): string {
  const params = new URLSearchParams()
  params.set(SCENARIO_QUERY_KEY, encodeScenarioPayload(scenario))
  return params.toString()
}

export function scenarioFromQueryString(search: string): Scenario | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const payload = params.get(SCENARIO_QUERY_KEY)
  if (!payload) return null
  return decodeScenarioPayload(payload)
}

