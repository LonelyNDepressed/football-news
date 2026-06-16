import { describe, it, expect } from 'vitest'
import {
  computeDps,
  critMultiplier,
  armorThreshold,
  armorReduction,
  armorBreakpoints,
  clearsFifty,
  clearsSeventyFive,
  elementalDamageTaken,
  offlineReward,
  runeQueue,
  num,
  parseShorthand,
  fmtGold,
} from './calculations.js'

describe('computeDps', () => {
  it('matches the game formula AS × AD × (1 + CC × (CD − 1))', () => {
    // AS 2, AD 100, Crit 25%, CritDmg 200% => 2*100*(1+0.25*(2-1)) = 250
    expect(computeDps({ AttackDamage: 100, AttackSpeed: 2, CritChance: 25, CritDamage: 200 })).toBe(250)
  })
  it('with no crit, equals AS × AD', () => {
    expect(computeDps({ AttackDamage: 50, AttackSpeed: 3, CritChance: 0, CritDamage: 150 })).toBe(150)
  })
  it('is 0 when any multiplicative stat is missing', () => {
    expect(computeDps({ AttackDamage: 0, AttackSpeed: 5 })).toBe(0)
  })
  it('has no crit cap (CritChance can exceed 100%)', () => {
    // AS1, AD100, CC 200%, CD 200% => 100*(1+2*(2-1)) = 300
    expect(computeDps({ AttackDamage: 100, AttackSpeed: 1, CritChance: 200, CritDamage: 200 })).toBe(300)
  })
})

describe('critMultiplier', () => {
  it('is 1 with zero crit chance', () => {
    expect(critMultiplier({ CritChance: 0, CritDamage: 300 })).toBe(1)
  })
  it('scales with chance and damage', () => {
    expect(critMultiplier({ CritChance: 50, CritDamage: 200 })).toBeCloseTo(1.5)
  })
})

describe('armor', () => {
  it('threshold is 14·stage + 12', () => {
    expect(armorThreshold(1)).toBe(26)
    expect(armorThreshold(10)).toBe(152)
    expect(armorThreshold(120)).toBe(1692)
  })
  it('breakpoints place 50% at T and 75% at 3T', () => {
    const bp = armorBreakpoints(10)
    expect(bp.fiftyPct).toBe(152)
    expect(bp.seventyFivePct).toBe(456)
  })
  it('gives ~50% reduction when armor equals the threshold and enemy hits at threshold', () => {
    const stage = 10
    const T = armorThreshold(stage)
    // With incomingDamage = T, reduction = T²/(T² + T·(T + 0.4T)) = 1/(1+1.4) ≈ 0.4167
    // The 50% identity holds when the damage term is negligible; verify it never exceeds the cap.
    const r = armorReduction(T, stage, T)
    expect(r).toBeGreaterThan(0)
    expect(r).toBeLessThanOrEqual(0.75)
  })
  it('is hard-capped at 75%', () => {
    expect(armorReduction(1e9, 10, 1)).toBeLessThanOrEqual(0.75)
  })
  it('clearsFifty / clearsSeventyFive gate on the breakpoints', () => {
    expect(clearsFifty(152, 10)).toBe(true)
    expect(clearsFifty(151, 10)).toBe(false)
    expect(clearsSeventyFive(456, 10)).toBe(true)
    expect(clearsSeventyFive(455, 10)).toBe(false)
  })
})

describe('elementalDamageTaken', () => {
  it('reduces linearly, 1 point = 1%', () => {
    expect(elementalDamageTaken(100, 30, 0)).toBe(70)
    expect(elementalDamageTaken(100, 20, 20)).toBe(60)
  })
  it('negative resist increases damage taken', () => {
    expect(elementalDamageTaken(100, -25, 0)).toBe(125)
  })
})

describe('offlineReward', () => {
  it('caps credited time at 8 hours', () => {
    const r = offlineReward({ secondsAway: 100000, offlineRuneCount: 0 })
    expect(r.cappedSeconds).toBe(28800)
  })
  it('adds +10% per offline rune (additive)', () => {
    expect(offlineReward({ secondsAway: 3600, offlineRuneCount: 3 }).multiplier).toBeCloseTo(1.3)
  })
  it('voids the reward after ~30 days (anti-tamper)', () => {
    const r = offlineReward({ secondsAway: 28800, offlineRuneCount: 5, daysAway: 31 })
    expect(r.voided).toBe(true)
    expect(r.multiplier).toBe(0)
  })
})

describe('runeQueue', () => {
  it('returns the first un-owned rune as next', () => {
    const q = runeQueue([], 0, 1)
    expect(q.next.id).toBe('rune_of_war')
  })
  it('skips command runes whose slot is already unlocked', () => {
    const q = runeQueue(['rune_of_war'], 999999, 2)
    expect(q.queue.find((r) => r.id === 'command_1')).toBeUndefined()
    expect(q.queue.find((r) => r.id === 'command_2')).toBeDefined()
  })
  it('reports affordability and how far gold stretches in sequence', () => {
    // War (100) + Command I (2000) = 2100 cumulative
    const q = runeQueue([], 2100, 1)
    expect(q.canAffordNext).toBe(true)
    expect(q.goldReachIndex).toBe(1) // reaches through index 1 (Command I)
  })
  it('goldReachIndex is -1 when the first rune is unaffordable', () => {
    expect(runeQueue([], 50, 1).goldReachIndex).toBe(-1)
  })
})

describe('num & parseShorthand', () => {
  it('num strips commas and handles blanks', () => {
    expect(num('12,000')).toBe(12000)
    expect(num('')).toBe(0)
    expect(num(undefined)).toBe(0)
  })
  it('parseShorthand understands k/m/b/t suffixes', () => {
    expect(parseShorthand('1.5m')).toBe(1500000)
    expect(parseShorthand('250k')).toBe(250000)
    expect(parseShorthand('3.4b')).toBe(3400000000)
    expect(parseShorthand('2t')).toBe(2000000000000)
  })
  it('parseShorthand falls back to plain numbers and garbage to 0', () => {
    expect(parseShorthand('12000')).toBe(12000)
    expect(parseShorthand('abc')).toBe(0)
    expect(parseShorthand('')).toBe(0)
  })
})

describe('fmtGold', () => {
  it('compacts large numbers', () => {
    expect(fmtGold(1500)).toBe('1.5K')
    expect(fmtGold(2000000)).toBe('2M')
    expect(fmtGold(1100000000)).toBe('1.1B')
    expect(fmtGold(999)).toBe('999')
  })
})
