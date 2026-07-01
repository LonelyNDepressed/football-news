import { describe, it, expect } from 'vitest'
import {
  survivalPressure,
  pressureFactors,
  slotWeights,
  slotPriority,
  scoreItem,
} from './gear.js'

describe('survivalPressure', () => {
  it('is high (survival-critical) when armor is far under the stage threshold', () => {
    const pr = survivalPressure({
      stageLevel: 20, // threshold 292
      ownedHeroes: ['knight'],
      heroStats: { knight: { Armor: 20, MaxHP: 5000 } },
    })
    expect(pr.p).toBeGreaterThan(0.66)
    expect(pr.label).toBe('Survival-critical')
  })

  it('is low (damage-focused) when armor is well past the 75% cap', () => {
    const pr = survivalPressure({
      stageLevel: 5, // threshold 82, 3× = 246
      ownedHeroes: ['knight'],
      heroStats: { knight: { Armor: 1000, MaxHP: 50000 } },
    })
    expect(pr.p).toBeLessThan(0.33)
    expect(pr.label).toBe('Damage-focused')
  })

  it('falls back to a stage estimate with no stats, rising with stage', () => {
    const low = survivalPressure({ stageLevel: 1, ownedHeroes: [], heroStats: {} })
    const high = survivalPressure({ stageLevel: 120, ownedHeroes: [], heroStats: {} })
    expect(low.hasStats).toBe(false)
    expect(high.p).toBeGreaterThan(low.p)
  })
})

describe('pressureFactors', () => {
  it('favors offense at p=0 and defense at p=1, balanced at p=0.5', () => {
    const lo = pressureFactors(0)
    expect(lo.offense).toBeGreaterThan(lo.defense)
    const hi = pressureFactors(1)
    expect(hi.defense).toBeGreaterThan(hi.offense)
    const mid = pressureFactors(0.5)
    expect(mid.offense).toBeCloseTo(mid.defense)
  })
})

describe('slot weights & priority', () => {
  it('a weapon stays damage-led but defense climbs as pressure rises', () => {
    const safe = slotWeights('sword', 0)
    const danger = slotWeights('sword', 1)
    // Armor's weight should be higher under pressure than when safe.
    expect(danger.Armor).toBeGreaterThan(safe.Armor)
    // Attack Speed's weight should be higher when safe than under pressure.
    expect(safe.AttackSpeed).toBeGreaterThan(danger.AttackSpeed)
  })

  it('defensive armor slot leads with a defensive stat under high pressure', () => {
    const top = slotPriority('armor', 0.9)[0]
    expect(top.side).toBe('defense')
  })

  it('DPS weapon slot leads with an offensive stat when safe', () => {
    const top = slotPriority('sword', 0.05)[0]
    expect(top.side).toBe('offense')
  })
})

describe('scoreItem is stage-aware', () => {
  it('can flip the winner between a low and a high stage', () => {
    const dpsItem = { slot: 'sword', rarity: 'Common', stats: { AttackDamage: 100, AttackSpeed: 2 } }
    const tankItem = { slot: 'sword', rarity: 'Common', stats: { Armor: 100, MaxHP: 200 } }

    // Safe (low pressure): the DPS item should win.
    const safeP = 0.05
    expect(scoreItem(dpsItem, safeP).total).toBeGreaterThan(scoreItem(tankItem, safeP).total)

    // Fragile (high pressure): the defensive item should close or overtake.
    const dangerP = 0.95
    const dpsHigh = scoreItem(dpsItem, dangerP).total
    const tankHigh = scoreItem(tankItem, dangerP).total
    // The defensive item gains ground relative to the safe case.
    const safeRatio = scoreItem(tankItem, safeP).total / scoreItem(dpsItem, safeP).total
    const dangerRatio = tankHigh / dpsHigh
    expect(dangerRatio).toBeGreaterThan(safeRatio)
  })

  it('applies the rarity multiplier', () => {
    const common = scoreItem({ slot: 'ring', rarity: 'Common', stats: { Armor: 100 } }, 0.5)
    const cosmic = scoreItem({ slot: 'ring', rarity: 'Cosmic', stats: { Armor: 100 } }, 0.5)
    expect(cosmic.total).toBeGreaterThan(common.total)
  })
})
