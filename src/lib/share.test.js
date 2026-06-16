import { describe, it, expect } from 'vitest'
import { encodeState, decodeState, exportJson, importJson } from './share.js'

const sample = {
  gold: 1500000,
  heroLevel: 42,
  stageLevel: 30,
  slotsUnlocked: 2,
  ownedHeroes: ['knight', 'priest'],
  heroStats: { knight: { Armor: 500 } },
  ownedRunes: ['rune_of_war', 'command_1'],
}

describe('build sharing round-trip', () => {
  it('encodes and decodes losslessly for known fields', () => {
    const decoded = decodeState(encodeState(sample))
    expect(decoded.gold).toBe(sample.gold)
    expect(decoded.ownedHeroes).toEqual(sample.ownedHeroes)
    expect(decoded.ownedRunes).toEqual(sample.ownedRunes)
    expect(decoded.heroStats.knight.Armor).toBe(500)
  })

  it('returns null for a corrupt code', () => {
    expect(decodeState('!!!not-base64!!!')).toBeNull()
  })

  it('sanitizes unknown fields and bad shapes on import', () => {
    const dirty = JSON.stringify({ gold: 5, evil: 'rm -rf', ownedHeroes: 'nope' })
    const parsed = importJson(dirty)
    expect(parsed.gold).toBe(5)
    expect(parsed).not.toHaveProperty('evil')
    expect(Array.isArray(parsed.ownedHeroes)).toBe(true) // coerced back to []
  })

  it('exportJson produces valid, re-importable JSON', () => {
    const round = importJson(exportJson(sample))
    expect(round.heroLevel).toBe(42)
  })
})
