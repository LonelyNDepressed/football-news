import { describe, it, expect } from 'vitest'
import { bestComp, scoreComp, compGap } from './comp.js'

describe('team composition optimizer', () => {
  it('prefers a comp with a front-line over an all-squishy one', () => {
    const withFront = scoreComp(['knight', 'ranger'], {
      ranger: { AttackDamage: 100, AttackSpeed: 2 },
    })
    const noFront = scoreComp(['ranger', 'sorcerer'], {
      ranger: { AttackDamage: 100, AttackSpeed: 2 },
      sorcerer: { AttackDamage: 100, AttackSpeed: 2 },
    })
    expect(withFront.score).toBeGreaterThan(noFront.score)
  })

  it('values the Priest synergy buff to whole-party damage', () => {
    const withPriest = scoreComp(['knight', 'priest'], {})
    expect(withPriest.hasPriest).toBe(true)
    expect(withPriest.priestSynergy).toBeGreaterThan(1)
  })

  it('picks the best party limited by unlocked slots', () => {
    const { best, size } = bestComp(['knight', 'ranger', 'sorcerer', 'priest'], 2, {
      ranger: { AttackDamage: 300, AttackSpeed: 3 },
      sorcerer: { AttackDamage: 100, AttackSpeed: 1 },
    })
    expect(size).toBe(2)
    expect(best.heroIds).toHaveLength(2)
    // A 2-slot comp should keep a frontliner (knight).
    expect(best.heroIds).toContain('knight')
  })

  it('benches heroes that do not make the cut', () => {
    const { bench } = bestComp(['knight', 'ranger', 'sorcerer'], 1, {})
    expect(bench.length).toBe(2)
  })

  it('returns an empty result when no heroes are owned', () => {
    const { best, ranked } = bestComp([], 3, {})
    expect(best).toBeNull()
    expect(ranked).toHaveLength(0)
  })

  it('compGap advises a frontline first, then a Priest', () => {
    const noFront = scoreComp(['ranger', 'sorcerer'], {})
    expect(compGap(noFront)).toMatch(/Knight|Slayer|front/i)
    const frontNoPriest = scoreComp(['knight', 'ranger'], {})
    expect(compGap(frontNoPriest)).toMatch(/Priest/i)
  })
})
