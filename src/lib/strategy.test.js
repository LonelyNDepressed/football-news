import { describe, it, expect } from 'vitest'
import { nextBestAction } from './strategy.js'

const base = {
  gold: 0,
  heroLevel: 10,
  stageLevel: 5,
  slotsUnlocked: 1,
  ownedHeroes: [],
  heroStats: {},
  ownedRunes: [],
}

describe('nextBestAction triage', () => {
  it('asks for heroes when none are selected', () => {
    const r = nextBestAction(base)
    expect(r.verdict).toMatch(/Add your heroes/i)
  })

  it('recommends unlocking a hero slot when affordable', () => {
    const r = nextBestAction({
      ...base,
      gold: 5000,
      slotsUnlocked: 1,
      ownedHeroes: ['knight', 'ranger'],
      heroStats: {
        knight: { Armor: 500, MaxHP: 5000 },
        ranger: { AttackDamage: 200, AttackSpeed: 3, CritChance: 30, CritDamage: 200 },
      },
      ownedRunes: ['rune_of_war'],
    })
    expect(r.severity).toBe('progress')
    expect(r.verdict).toMatch(/Command I/i)
  })

  it('flags survival when the frontline is under the armor threshold', () => {
    const r = nextBestAction({
      ...base,
      slotsUnlocked: 3,
      stageLevel: 20,
      gold: 0,
      ownedHeroes: ['knight', 'ranger'],
      heroStats: {
        knight: { Armor: 10, MaxHP: 100 },
        ranger: { AttackDamage: 50, AttackSpeed: 1 },
      },
    })
    expect(r.severity).toBe('critical')
    expect(r.verdict).toMatch(/Armor|HP|survival/i)
  })

  it('tells an all-DPS party to add a frontline', () => {
    const r = nextBestAction({
      ...base,
      slotsUnlocked: 3,
      ownedHeroes: ['ranger', 'sorcerer'],
      heroStats: {
        ranger: { AttackDamage: 50, AttackSpeed: 1, MaxHP: 60 },
        sorcerer: { AttackDamage: 80, AttackSpeed: 1, MaxHP: 50 },
      },
    })
    expect(r.severity).toBe('critical')
    expect(r.verdict).toMatch(/frontline|Knight|Slayer/i)
  })

  it('recommends gold farm when survivable but cannot afford the next structural rune', () => {
    const r = nextBestAction({
      ...base,
      slotsUnlocked: 1,
      stageLevel: 3,
      gold: 100, // owns War already, but can't afford Command I (2000)
      ownedHeroes: ['knight', 'ranger'],
      heroStats: {
        knight: { Armor: 2000, MaxHP: 20000 },
        ranger: { AttackDamage: 500, AttackSpeed: 5, CritChance: 50, CritDamage: 250 },
      },
      ownedRunes: ['rune_of_war'],
    })
    expect(r.verdict).toMatch(/Gold farm/i)
  })

  it('recommends XP farm when survivable, funded, but slow', () => {
    const r = nextBestAction({
      ...base,
      slotsUnlocked: 3,
      stageLevel: 40, // wants ~6000 DPS
      gold: 0,
      ownedHeroes: ['knight', 'ranger'],
      ownedRunes: ['rune_of_war', 'command_1', 'command_2', 'awakening', 'auto_open_common', 'auto_open_boss',
        'wealth_gold_kill', 'wealth_boss_gold', 'wealth_gold_mult', 'growth_xp', 'offline_gold', 'offline_xp',
        'expansion_inventory', 'combat_stat', 'drop_explore'],
      heroStats: {
        knight: { Armor: 3000, MaxHP: 50000 },
        ranger: { AttackDamage: 100, AttackSpeed: 1, CritChance: 0, CritDamage: 150 }, // ~100 DPS, slow
      },
    })
    expect(r.verdict).toMatch(/XP farm/i)
  })
})
