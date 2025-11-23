const CONSENSUS_WEIGHT_LIMIT = 4_000_000

const clampRho = (rho: number) => Math.min(1, Math.max(0, rho))

export interface LossInputs {
  windowBlocks: number
  wCoinbase?: number
  replaced?: number
  orphan?: number
  dust?: number
  policy?: number
  other?: number
}

export interface WeightBucket {
  weight: number
  share: number
}

export const defaultCoinbaseWeight = 2_000

export function cMax(windowBlocks: number, wCoinbase: number = defaultCoinbaseWeight): number {
  if (windowBlocks <= 0) return 0
  const usablePerBlock = Math.max(0, CONSENSUS_WEIGHT_LIMIT - wCoinbase)
  return usablePerBlock * windowBlocks
}

export function effectiveCapacity(
  rho: number,
  windowBlocks: number,
  wCoinbase: number = defaultCoinbaseWeight,
): number {
  if (windowBlocks <= 0) return 0
  return clampRho(rho) * cMax(windowBlocks, wCoinbase)
}

export function nMax(
  rho: number,
  windowBlocks: number,
  perUserWeight: number,
  wCoinbase: number = defaultCoinbaseWeight,
): number {
  if (perUserWeight <= 0) return 0
  const capacity = effectiveCapacity(rho, windowBlocks, wCoinbase)
  if (capacity <= 0) return 0
  return Math.floor(capacity / perUserWeight)
}

export function blendedWeight(buckets: WeightBucket[]): number {
  if (!buckets.length) return 0
  const numerator = buckets.reduce((sum, bucket) => sum + bucket.weight * bucket.share, 0)
  const denominator = buckets.reduce((sum, bucket) => sum + bucket.share, 0)
  if (denominator === 0) return 0
  return numerator / denominator
}

export function rhoFromLosses({
  windowBlocks,
  wCoinbase = defaultCoinbaseWeight,
  replaced = 0,
  orphan = 0,
  dust = 0,
  policy = 0,
  other = 0,
}: LossInputs): number {
  if (windowBlocks <= 0) return 0
  const maxCapacity = cMax(windowBlocks, wCoinbase)
  if (maxCapacity === 0) return 0
  const totalLoss = replaced + orphan + dust + policy + other
  return clampRho(1 - totalLoss / maxCapacity)
}

export function leadTimeBlocks(
  users: number,
  perUserWeight: number,
  rho: number,
  avgPerBlockCapacity: number,
): number {
  if (users <= 0 || perUserWeight <= 0 || avgPerBlockCapacity <= 0) return 0
  return (users * perUserWeight) / (clampRho(rho) * avgPerBlockCapacity)
}

export const SECURITY_ZONES = {
  safe: 83_000,
  probabilistic: 232_000,
}

export type SecurityZone = 'safe' | 'probabilistic' | 'insolvent'

export function classifySecurityZone(usersAttemptingExit: number): SecurityZone {
  if (usersAttemptingExit <= SECURITY_ZONES.safe) return 'safe'
  if (usersAttemptingExit <= SECURITY_ZONES.probabilistic) return 'probabilistic'
  return 'insolvent'
}

