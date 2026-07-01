// Stage-aware gear scoring. The core idea, straight from the game's own math:
// as you climb, the armor survival threshold grows (+14 per stage level), so the
// value of defensive stats rises relative to raw damage. This module turns a
// player's current stage + entered durability into a "survival pressure" and
// reallocates stat weights accordingly — no invented item catalog, just the
// real formulas applied to whatever item stats you paste in.

import { GEAR_SLOTS, RARITIES, HERO_BY_ID, ROLES } from '../data/gameData.js'
import { num, armorThreshold } from './calculations.js'

// The stats an item can carry, split into offense vs defense.
export const STAT_DEFS = [
  { key: 'AttackDamage', label: 'Attack Damage', side: 'offense', base: { dps: 2.4, def: 1.0 } },
  { key: 'AttackSpeed', label: 'Attack Speed', side: 'offense', base: { dps: 3.0, def: 1.2 } },
  { key: 'CritChance', label: 'Crit Chance %', side: 'offense', base: { dps: 2.8, def: 1.5 } },
  { key: 'CritDamage', label: 'Crit Damage %', side: 'offense', base: { dps: 1.8, def: 0.8 } },
  { key: 'MaxHP', label: 'Max HP', side: 'defense', base: { dps: 0.25, def: 0.5 } },
  { key: 'Armor', label: 'Armor', side: 'defense', base: { dps: 0.4, def: 1.4 } },
  { key: 'ElementResist', label: 'Element Resist', side: 'defense', base: { dps: 0.3, def: 1.1 } },
]

export const RARITY_MULT = Object.fromEntries(RARITIES.map((r, i) => [r, 1 + i * 0.15]))

export const SLOT_BY_ID = Object.fromEntries(GEAR_SLOTS.map((s) => [s.id, s]))

// How far the weighting can swing between full-offense and full-defense.
const SPREAD = 0.85

const FRONT_ROLES = new Set([ROLES.TANK, ROLES.BRUISER])

/**
 * Survival pressure p ∈ [0,1] for the player's current situation.
 * 0 = you're safe, stack damage. 1 = you're fragile, defense is urgent.
 * Derived from your best frontliner's Armor vs the stage threshold T (50% at T,
 * 75% cap at 3T). If no stats are entered, falls back to a stage-based estimate.
 */
export function survivalPressure(state = {}) {
  const stage = num(state.stageLevel) || 1
  const T = armorThreshold(stage)

  const owned = (state.ownedHeroes || []).map((id) => ({
    hero: HERO_BY_ID[id],
    s: (state.heroStats || {})[id] || {},
  }))
  const frontliners = owned.filter((x) => x.hero && FRONT_ROLES.has(x.hero.role))
  const pool = frontliners.length ? frontliners : owned
  const bestArmor = Math.max(0, 0, ...pool.map((x) => num(x.s.Armor)))
  const bestHp = Math.max(0, 0, ...pool.map((x) => num(x.s.MaxHP)))
  const hasStats = bestArmor > 0

  let p
  if (hasStats) {
    // ratio of armor to threshold: 3+ (at the 75% cap) => 0 pressure; 0.3 or
    // below => max pressure; linear between.
    const ratio = bestArmor / T
    p = clamp01((3 - ratio) / (3 - 0.3))
    // Thin HP nudges pressure up (a healthy frontline carries well past 2×T HP).
    if (bestHp > 0 && bestHp < T * 2) p = clamp01(p + 0.15)
  } else {
    // No durability entered: assume roughly at-threshold and let stage raise it
    // gently, since higher stages are harder to survive.
    p = clamp01(0.35 + (stage / 120) * 0.3)
  }

  return {
    p,
    label: p >= 0.66 ? 'Survival-critical' : p >= 0.33 ? 'Balanced' : 'Damage-focused',
    tone: p >= 0.66 ? 'bad' : p >= 0.33 ? 'gold' : 'good',
    bestArmor,
    bestHp,
    threshold: T,
    stage,
    hasStats,
    armorRatio: hasStats ? bestArmor / T : null,
  }
}

/** Offense/defense multipliers for a given pressure. Reallocates, not inflates. */
export function pressureFactors(p) {
  return {
    offense: 1 + (1 - p) * SPREAD,
    defense: 1 + p * SPREAD,
  }
}

/**
 * Per-stat weights for a slot at a given survival pressure.
 * Returns { [statKey]: weight } sorted-desc convenience via slotPriority().
 */
export function slotWeights(slotId, p) {
  const slot = SLOT_BY_ID[slotId]
  const isDps = slot?.dps
  const { offense, defense } = pressureFactors(p)
  const out = {}
  for (const d of STAT_DEFS) {
    const base = isDps ? d.base.dps : d.base.def
    out[d.key] = base * (d.side === 'offense' ? offense : defense)
  }
  return out
}

/** Ordered stat priority list for a slot at a pressure (for the guide UI). */
export function slotPriority(slotId, p) {
  const w = slotWeights(slotId, p)
  return STAT_DEFS.map((d) => ({ key: d.key, label: d.label, side: d.side, weight: w[d.key] }))
    .sort((a, b) => b.weight - a.weight)
}

/**
 * Score a pasted item, stage-aware.
 * @param item { slot, rarity, stats:{statKey:value} }
 * @param p survival pressure (default 0.5 = neutral, matches the old behavior)
 */
export function scoreItem(item, p = 0.5) {
  const weights = slotWeights(item.slot, p)
  let raw = 0
  const breakdown = []
  for (const d of STAT_DEFS) {
    const v = num(item.stats?.[d.key])
    if (!v) continue
    const contrib = v * weights[d.key]
    raw += contrib
    breakdown.push({ key: d.key, label: d.label, value: v, weight: weights[d.key], contrib })
  }
  breakdown.sort((a, b) => b.contrib - a.contrib)
  const rarityMult = RARITY_MULT[item.rarity] || 1
  const slot = SLOT_BY_ID[item.slot]
  return { raw, total: raw * rarityMult, rarityMult, breakdown, isDps: !!slot?.dps, slotName: slot?.name }
}

/** Distinct slot archetypes for the priority guide. */
export const SLOT_GROUPS = [
  {
    id: 'weapon',
    title: 'Weapons',
    example: 'sword',
    slots: GEAR_SLOTS.filter((s) => s.group === 'Weapon').map((s) => s.name),
    note: 'Main-hand DPS. Damage stats dominate — but even here, survival stats climb the list at high stages.',
  },
  {
    id: 'offhand',
    title: 'Off-hands',
    example: 'orb',
    slots: GEAR_SLOTS.filter((s) => s.group === 'Off-hand').map((s) => s.name),
    note: 'Mixed: Arrow/Orb/Tome/Bolt/Hatchet lean DPS; Shield leans defense.',
  },
  {
    id: 'armor',
    title: 'Armor',
    example: 'armor',
    slots: GEAR_SLOTS.filter((s) => s.group === 'Armor').map((s) => s.name),
    note: 'Helmet/Armor/Gloves/Boots. Survival-first — weight rises fast with stage.',
  },
  {
    id: 'jewelry',
    title: 'Jewelry',
    example: 'ring',
    slots: GEAR_SLOTS.filter((s) => s.group === 'Jewelry').map((s) => s.name),
    note: 'Amulet/Earring/Ring/Bracer. Flexible — good place to shore up whichever side you lack.',
  },
]

/** Sample stages for the "how priority shifts as you climb" trend table. */
export const SAMPLE_STAGES = [1, 30, 60, 90, 120]

function clamp01(x) {
  return Math.max(0, Math.min(1, x))
}
