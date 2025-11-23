import { describe, expect, it } from 'vitest'

import {
  SCENARIOS,
  decodeScenarioPayload,
  encodeScenarioPayload,
  scenarioEffectiveWeight,
  scenarioFromQueryString,
  scenarioMetrics,
  scenarioToQueryString,
} from './scenarios'

const findScenario = (id: string) => SCENARIOS.find((s) => s.id === id)!

describe('scenario metrics', () => {
  it('recovers the published Retail Panic capacity', () => {
    const metrics = scenarioMetrics(findScenario('retail-panic'))
    expect(metrics.effectiveWeight).toBe(4_616)
    expect(metrics.maxUsers).toBe(94_926)
  })

  it('computes the blended weight for the mixed economy case', () => {
    const scenario = findScenario('mixed-economy')
    const effectiveWeight = scenarioEffectiveWeight(scenario)
    expect(effectiveWeight).toBe(3_488)
    const metrics = scenarioMetrics(scenario)
    expect(metrics.maxUsers).toBe(396_132)
  })

  it('estimates Ark capacities for week-long windows', () => {
    const metrics = scenarioMetrics(findScenario('ark-week'))
    expect(metrics.effectiveWeight).toBe(3_200)
    expect(metrics.maxUsers).toBe(1_007_496)
  })
})

describe('scenario sharing helpers', () => {
  it('roundtrips the encoded payload', () => {
    const scenario = findScenario('quiet-exit')
    const encoded = encodeScenarioPayload(scenario)
    const decoded = decodeScenarioPayload(encoded)
    expect(decoded).toEqual(scenario)
  })

  it('embeds the payload in a query string that can be read back', () => {
    const scenario = findScenario('institutional')
    const query = scenarioToQueryString(scenario)
    const restored = scenarioFromQueryString(query)
    expect(restored).toEqual(scenario)
  })
})

