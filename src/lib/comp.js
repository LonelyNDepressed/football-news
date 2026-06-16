// Team composition optimizer. Given the heroes a player owns and how many slots
// they have unlocked, work out the single strongest party they can field — and
// explain exactly why, plus what to chase next.

import { HERO_BY_ID, ROLES } from '../data/gameData.js'
import { computeDps, num } from './calculations.js'

const FRONT_ROLES = new Set([ROLES.TANK, ROLES.BRUISER])

/**
 * Generate every combination of `k` items from `arr`.
 */
function combinations(arr, k) {
  if (k <= 0) return [[]]
  if (k > arr.length) return []
  const result = []
  const helper = (start, combo) => {
    if (combo.length === k) {
      result.push(combo.slice())
      return
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i])
      helper(i + 1, combo)
      combo.pop()
    }
  }
  helper(0, [])
  return result
}

/**
 * Score a candidate party of hero ids.
 * The scoring encodes the game's comp wisdom:
 *  - A front-line (Knight/Slayer) is near-mandatory; without one the back line melts.
 *  - A Priest is a force multiplier — Blessing of Might buffs the WHOLE party's damage.
 *  - Beyond that, raw party DPS decides.
 */
export function scoreComp(heroIds, heroStats = {}) {
  const heroes = heroIds.map((id) => HERO_BY_ID[id]).filter(Boolean)
  const hasFront = heroes.some((h) => FRONT_ROLES.has(h.role))
  const hasPriest = heroes.some((h) => h.id === 'priest')

  // Party DPS. Priest applies a synergy multiplier to the team's damage
  // (Blessing of Might). We model it as a flat team-wide uplift so the optimizer
  // values bringing the Priest even when its own DPS is low.
  const rawDps = heroes.reduce((sum, h) => sum + computeDps(heroStats[h.id] || {}), 0)
  const priestSynergy = hasPriest ? 1.25 : 1
  const effectiveDps = rawDps * priestSynergy

  // Structural score so comps are ranked by soundness first, then output.
  let structure = 0
  const notes = []
  if (hasFront) {
    structure += 1000
  } else {
    notes.push('No front-line tank/bruiser — back-line heroes will take hits directly.')
  }
  if (hasPriest) {
    structure += 600
    notes.push('Priest included — Blessing of Might buffs the entire party (+damage) and Heal sustains the front.')
  }
  // Reward role diversity (a back-line DPS alongside the front line).
  const roleSet = new Set(heroes.map((h) => h.role))
  structure += roleSet.size * 80

  // Penalise comps that are all squishy back-liners.
  const backOnly = heroes.length > 1 && heroes.every((h) => !FRONT_ROLES.has(h.role) && h.id !== 'priest')
  if (backOnly) {
    structure -= 400
    notes.push('All damage, no durability — survivable only if you heavily out-gear the stage.')
  }

  const score = structure + effectiveDps
  return {
    heroIds,
    heroes,
    score,
    rawDps,
    effectiveDps,
    hasFront,
    hasPriest,
    priestSynergy,
    notes,
  }
}

/**
 * Pick the best party of up to `slots` heroes from `ownedHeroes`.
 * Returns the winning comp plus the full ranked list, and bench advice.
 */
export function bestComp(ownedHeroes = [], slots = 1, heroStats = {}) {
  const owned = ownedHeroes.filter((id) => HERO_BY_ID[id])
  const size = Math.min(num(slots) || 1, owned.length, 3)
  if (owned.length === 0 || size === 0) {
    return { best: null, ranked: [], bench: [], size: 0 }
  }

  const combos = combinations(owned, size)
  const ranked = combos.map((c) => scoreComp(c, heroStats)).sort((a, b) => b.score - a.score)
  const best = ranked[0]
  const bench = owned.filter((id) => !best.heroIds.includes(id)).map((id) => HERO_BY_ID[id])

  return { best, ranked, bench, size }
}

/**
 * What single hero (not yet owned, or owned but benched) would most improve the
 * comp? Used to advise acquisition. Returns a short suggestion string or null.
 */
export function compGap(best) {
  if (!best) return null
  if (!best.hasFront) {
    return 'Acquire or slot a Knight (tankiest) or Slayer (self-sustaining bruiser) to anchor the front — your single biggest survivability upgrade.'
  }
  if (!best.hasPriest) {
    return 'A Priest is the strongest support in the game — Blessing of Might multiplies your whole party\'s damage. Acquire it (DLC) when you can.'
  }
  return 'Your core structure is complete (front line + Priest support). Further gains come from gear and stat optimization on your DPS heroes.'
}
