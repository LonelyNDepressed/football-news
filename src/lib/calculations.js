// Pure game-math helpers. Every function here is deterministic and side-effect free
// so the UI can compute and explain recommendations transparently.

import {
  RUNES,
  OFFLINE_CAP_SECONDS,
  OFFLINE_RUNE_BONUS,
} from '../data/gameData.js'

/**
 * Effective DPS score.
 * DPS = AttackSpeed × AttackDamage × (1 + CritChance × (CritDamage − 1))
 * CritChance is entered as a percent (25 => 0.25).
 * CritDamage is entered as a percent multiplier (150 => 1.5×).
 */
export function computeDps({ AttackDamage = 0, AttackSpeed = 0, CritChance = 0, CritDamage = 150 }) {
  const ad = num(AttackDamage)
  const as = num(AttackSpeed)
  const cc = num(CritChance) / 100
  const cd = num(CritDamage) / 100
  const critMultiplier = 1 + cc * (cd - 1)
  return as * ad * critMultiplier
}

/** Crit's contribution as a multiplier (>=1), for explaining the score. */
export function critMultiplier({ CritChance = 0, CritDamage = 150 }) {
  const cc = num(CritChance) / 100
  const cd = num(CritDamage) / 100
  return 1 + cc * (cd - 1)
}

/** Armor value that yields 50% physical reduction at a given stage. Threshold T = 14·stage + 12. */
export function armorThreshold(stageLevel) {
  return 14 * num(stageLevel) + 12
}

/**
 * Physical damage reduction from armor.
 * Reduction = Armor² / (Armor² + (14·stage + 12) × (Armor + 0.4·Damage))
 * `incomingDamage` is the attacker's hit; defaults to the stage threshold as a
 * reasonable proxy when the player has not entered an enemy damage figure.
 */
export function armorReduction(armor, stageLevel, incomingDamage) {
  const a = num(armor)
  if (a <= 0) return 0
  const T = armorThreshold(stageLevel)
  const dmg = incomingDamage == null ? T : num(incomingDamage)
  const raw = (a * a) / (a * a + T * (a + 0.4 * dmg))
  return Math.min(raw, 0.75) // hard cap 75%
}

/**
 * Survival breakpoints for a stage.
 * 50% reduction at Armor = T; 75% (cap) at ≈ 3T.
 */
export function armorBreakpoints(stageLevel) {
  const T = armorThreshold(stageLevel)
  return { threshold: T, fiftyPct: T, seventyFivePct: 3 * T }
}

export function clearsFifty(armor, stageLevel) {
  return num(armor) >= armorThreshold(stageLevel)
}

export function clearsSeventyFive(armor, stageLevel) {
  return num(armor) >= 3 * armorThreshold(stageLevel)
}

/**
 * Elemental resistance (linear).
 * damageTaken = Damage × (1 − effRes/100), effRes = ElementResist + AllElementalResist.
 */
export function elementalDamageTaken(damage, elementResist = 0, allElementalResist = 0) {
  const effRes = num(elementResist) + num(allElementalResist)
  return num(damage) * (1 - effRes / 100)
}

/**
 * Offline reward multiplier and capped seconds.
 * Caps at 8h; each Offline rune adds +10% (additive); 30+ days away => 0 (anti-tamper).
 */
export function offlineReward({ secondsAway = 0, offlineRuneCount = 0, daysAway = 0 }) {
  if (num(daysAway) >= 30) {
    return { cappedSeconds: 0, multiplier: 0, voided: true, bonusPct: offlineRuneCount * 10 }
  }
  const cappedSeconds = Math.min(num(secondsAway), OFFLINE_CAP_SECONDS)
  const multiplier = 1 + num(offlineRuneCount) * OFFLINE_RUNE_BONUS
  return {
    cappedSeconds,
    multiplier,
    voided: false,
    bonusPct: num(offlineRuneCount) * 10,
    capHours: OFFLINE_CAP_SECONDS / 3600,
  }
}

/**
 * Rune queue logic. Returns the next un-owned rune in priority order, a queue,
 * and how far the current gold stretches down that queue (cumulative cost).
 */
export function runeQueue(ownedRuneIds, gold, slotsUnlocked = 1) {
  const owned = new Set(ownedRuneIds || [])
  const g = num(gold)

  // Skip Command runes whose slot is already unlocked even if not "checked".
  const remaining = RUNES.filter((r) => {
    if (owned.has(r.id)) return false
    if (r.grantsHeroSlot && r.grantsHeroSlot <= num(slotsUnlocked)) return false
    return true
  })

  let cumulative = 0
  let goldReachIndex = -1 // furthest index affordable if you saved current gold and bought in order
  const queue = remaining.map((r, i) => {
    cumulative += r.cost
    const affordableNow = g >= r.cost
    const affordableInSequence = g >= cumulative
    if (affordableInSequence) goldReachIndex = i
    return {
      ...r,
      cumulativeCost: cumulative,
      affordableNow,
      affordableInSequence,
      shortBy: Math.max(0, r.cost - g),
    }
  })

  return {
    next: queue[0] || null,
    queue,
    goldReachIndex, // -1 means can't afford even the first
    canAffordNext: queue[0] ? g >= queue[0].cost : false,
  }
}

/** Number coercion that treats blanks/NaN as 0. */
export function num(v) {
  const n = typeof v === 'number' ? v : parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

/** Pretty integer with thousands separators. */
export function fmt(n) {
  const v = num(n)
  if (Math.abs(v) >= 1000) return Math.round(v).toLocaleString('en-US')
  // keep up to 2 decimals for small numbers
  return (Math.round(v * 100) / 100).toLocaleString('en-US')
}

/** Compact gold formatting (1.2K, 3.4M, 1.1B). */
export function fmtGold(n) {
  const v = num(n)
  const abs = Math.abs(v)
  if (abs >= 1e9) return (v / 1e9).toFixed(2).replace(/\.00$/, '') + 'B'
  if (abs >= 1e6) return (v / 1e6).toFixed(2).replace(/\.00$/, '') + 'M'
  if (abs >= 1e3) return (v / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(Math.round(v))
}

export function pct(fraction) {
  return `${Math.round(num(fraction) * 100)}%`
}
