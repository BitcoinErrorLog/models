import { describe, expect, it } from 'vitest'

import {
  SECURITY_ZONES,
  blendedWeight,
  cMax,
  classifySecurityZone,
  effectiveCapacity,
  leadTimeBlocks,
  nMax,
  rhoFromLosses,
} from './math'

describe('cMax and effective capacity', () => {
  it('returns the 137-block envelope from the paper', () => {
    expect(cMax(137)).toBe(547_726_000)
  })

  it('scales effective capacity by rho', () => {
    expect(effectiveCapacity(0.7, 137)).toBe(383_408_200)
  })
})

describe('nMax', () => {
  it('matches the 83,060 active-user bound at rho=0.7', () => {
    expect(nMax(0.7, 137, 4_616)).toBe(83_060)
  })

  it('matches the 162,461 idle-user bound at rho=0.7 (rounded difference vs. paper)', () => {
    expect(nMax(0.7, 137, 2_360)).toBe(162_461)
  })
})

describe('rhoFromLosses', () => {
  it('reproduces the 5 Oct 2025 congestion sample', () => {
    const rho = rhoFromLosses({
      windowBlocks: 137,
      replaced: 118_400_000,
      orphan: 22_800_000,
      dust: 8_100_000,
      policy: 10_900_000,
    })
    expect(rho).toBeCloseTo(0.71, 2)
  })
})

describe('blendedWeight', () => {
  it('averages weights by the provided share', () => {
    const result = blendedWeight([
      { weight: 4_616, share: 0.5 },
      { weight: 2_360, share: 0.5 },
    ])
    expect(result).toBe(3_488)
  })
})

describe('leadTimeBlocks', () => {
  it('approximates the lead time bound from the lemma', () => {
    const lead = leadTimeBlocks(50_000, 4_616, 0.7, 3_998_000)
    expect(lead).toBeCloseTo(82.5, 1)
  })
})

describe('Security zone classifier', () => {
  it('labels cohorts below the safe threshold as safe', () => {
    expect(classifySecurityZone(SECURITY_ZONES.safe - 1)).toBe('safe')
  })

  it('labels values in the middle band as probabilistic', () => {
    expect(classifySecurityZone(100_000)).toBe('probabilistic')
  })

  it('labels large values as insolvent', () => {
    expect(classifySecurityZone(SECURITY_ZONES.probabilistic + 1)).toBe('insolvent')
  })
})

