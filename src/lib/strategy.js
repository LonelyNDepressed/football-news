// Higher-level strategist logic. Turns raw player state into a single ranked
// "Next Best Action" plus the reasoning behind it.

import { HERO_BY_ID } from '../data/gameData.js'
import {
  num,
  fmtGold,
  computeDps,
  armorThreshold,
  clearsFifty,
  runeQueue,
} from './calculations.js'

/**
 * @param {object} state - the persisted player state
 * Returns { verdict, action, severity, reasons[], details{} }
 * severity: 'critical' | 'progress' | 'optimize'
 */
export function nextBestAction(state) {
  const {
    gold = 0,
    heroLevel = 1,
    stageLevel = 1,
    slotsUnlocked = 1,
    ownedHeroes = [],
    heroStats = {},
    ownedRunes = [],
  } = state

  const reasons = []
  const g = num(gold)
  const stage = num(stageLevel)
  const threshold = armorThreshold(stage)

  // --- Survival diagnostic ---------------------------------------------------
  // The party only needs ONE durable frontliner to clear the survival check, so
  // use the best armor / best HP across owned heroes.
  const stats = ownedHeroes.map((id) => ({
    id,
    hero: HERO_BY_ID[id],
    s: heroStats[id] || {},
  }))
  const bestArmor = Math.max(0, ...stats.map((x) => num(x.s.Armor)))
  const bestHp = Math.max(0, ...stats.map((x) => num(x.s.MaxHP)))
  const frontliners = stats.filter(
    (x) => x.hero && (x.hero.formation === 'Front'),
  )
  const hasFrontline = frontliners.length > 0
  const tankArmor = Math.max(0, 0, ...frontliners.map((x) => num(x.s.Armor)))

  // "Under survival threshold": no frontliner clears 50% armor reduction, OR
  // the best armor in the party is below the stage threshold and HP is thin.
  const armorUnderThreshold = (hasFrontline ? tankArmor : bestArmor) < threshold
  // HP heuristic: a healthy frontline carries roughly 8× the armor threshold in HP
  // by the time it should farm a stage. Below ~2× threshold is fragile.
  const hpFragile = bestHp > 0 && bestHp < threshold * 2

  // --- Total party DPS -------------------------------------------------------
  const partyDps = stats.reduce((sum, x) => sum + computeDps(x.s), 0)

  // --- Rune / slot diagnostic ------------------------------------------------
  const rq = runeQueue(ownedRunes, g, slotsUnlocked)
  const needsSlot = num(slotsUnlocked) < 3
  // The cheapest path to the next slot is the next Command rune in the queue.
  const nextCommand = rq.queue.find((r) => r.grantsHeroSlot)
  const canAffordSlot = nextCommand ? g >= nextCommand.cost : false

  // ===========================================================================
  // DECISION TREE (priority order)
  // ===========================================================================

  // 0. No heroes selected yet — onboarding.
  if (ownedHeroes.length === 0) {
    return {
      severity: 'progress',
      verdict: 'Add your heroes to begin',
      action: 'Open the top bar and select the heroes you own, then enter their stats.',
      reasons: [
        'The strategist needs your roster and per-hero stats to compute builds, DPS, and survival.',
      ],
      details: { threshold },
    }
  }

  // 1. Hero slots < 3 AND can afford the next Command rune -> unlock the slot.
  if (needsSlot && canAffordSlot && ownedHeroes.length >= num(slotsUnlocked)) {
    return {
      severity: 'progress',
      verdict: `Buy ${nextCommand.name} — unlock hero slot ${nextCommand.grantsHeroSlot}`,
      action: `You can afford ${nextCommand.name} (${fmtGold(nextCommand.cost)}g). Buying it unlocks slot ${nextCommand.grantsHeroSlot}.`,
      reasons: [
        `You currently field ${slotsUnlocked} of 3 hero slots.`,
        nextCommand.grantsHeroSlot === 2
          ? 'A second hero is the single biggest early power spike — it roughly doubles party output.'
          : 'A third hero completes a full comp (tank + support + DPS).',
        `Cost ${fmtGold(nextCommand.cost)}g vs your ${fmtGold(g)}g — affordable now.`,
      ],
      details: { threshold, partyDps, rune: nextCommand },
    }
  }

  // 2. Likely to wipe — under the survival threshold -> farm Armor / HP.
  if ((armorUnderThreshold || hpFragile) && hasFrontline) {
    reasons.push(
      `Stage ${stage} survival threshold is Armor ${threshold} (= 14×${stage}+12) for 50% physical reduction.`,
    )
    if (armorUnderThreshold) {
      reasons.push(
        `Your sturdiest frontliner has ${Math.round(hasFrontline ? tankArmor : bestArmor)} Armor — below ${threshold}, so you are taking near-full physical hits.`,
      )
    }
    if (hpFragile) {
      reasons.push(
        `Best Max HP in the party is ${Math.round(bestHp)} — fragile for this stage. Add HP so the front line outlasts boss spikes.`,
      )
    }
    return {
      severity: 'critical',
      verdict: 'Farm Armor / HP — you are under the survival threshold',
      action: `Push Armor toward ${threshold} (50% reduction) on your frontliner, and pad Max HP, before advancing. Runs are likely failing on durability, not damage.`,
      reasons,
      details: { threshold, partyDps, bestArmor, bestHp },
    }
  }

  // No frontline at all is its own survival problem.
  if (!hasFrontline) {
    return {
      severity: 'critical',
      verdict: 'Add a frontline (Knight or Slayer)',
      action: 'Your comp has no tank/bruiser to soak hits. Slot a Knight or Slayer up front so your back-line DPS survives.',
      reasons: [
        'Ranged/burst heroes (Ranger, Hunter, Sorcerer) have low base HP and melt without a frontliner.',
        `Stage ${stage} survival threshold is Armor ${threshold}.`,
      ],
      details: { threshold, partyDps },
    }
  }

  // 3. Survivable. Decide XP-farm vs gold-farm.
  // Economy-starved if you cannot afford the next priority rune AND it is a
  // structural one (slot/automation/wealth) you still need.
  const economyStarved =
    rq.next && !rq.canAffordNext && (rq.next.grantsHeroSlot || ['Automation', 'Wealth', 'Skills', 'Gateway'].includes(rq.next.category))

  // "Slow clears" proxy: party DPS is low relative to stage. Each stage level is
  // assumed to want ~ stage × 150 DPS to clear comfortably (tunable heuristic).
  const dpsExpectation = stage * 150
  const slowClears = partyDps > 0 && partyDps < dpsExpectation

  if (economyStarved) {
    return {
      severity: 'progress',
      verdict: `Gold farm — save for ${rq.next.name}`,
      action: `You are survivable but economy-gated: you cannot yet afford ${rq.next.name} (${fmtGold(rq.next.cost)}g, short ${fmtGold(rq.next.shortBy)}g). Farm gold on a stable stage and auto-collect.`,
      reasons: [
        `Runs are stable & repeating — the bottleneck is your wallet, not survival or speed.`,
        `Next priority rune ${rq.next.name} costs ${fmtGold(rq.next.cost)}g; you have ${fmtGold(g)}g.`,
        rq.next.grantsHeroSlot
          ? 'It unlocks a hero slot — by far the highest-value purchase available.'
          : `It is a ${rq.next.category.toLowerCase()} rune that compounds your future income/automation.`,
      ],
      details: { threshold, partyDps, rune: rq.next, dpsExpectation },
    }
  }

  if (slowClears) {
    return {
      severity: 'optimize',
      verdict: 'XP farm — out-level the wall',
      action: `You survive but clears are slow (party DPS ≈ ${Math.round(partyDps).toLocaleString()} vs ~${dpsExpectation.toLocaleString()} wanted for stage ${stage}). Farm a slightly easier stage for XP/levels, then push.`,
      reasons: [
        'Runs are safe but slow — the bottleneck is damage output, not survival.',
        `Leveling raises base stats across the party; pair with AttackSpeed/Crit gear on your DPS heroes.`,
        `Hero level ${heroLevel} — keep climbing the 1–100 table to out-scale the stage.`,
      ],
      details: { threshold, partyDps, dpsExpectation },
    }
  }

  // 4. Stable, fast, and funded -> push & optimize / farm drops.
  return {
    severity: 'optimize',
    verdict: 'Push the next stage — you are stable & funded',
    action: rq.next
      ? `Runs are stable, fast, and you can afford ${rq.next.name}. Advance the stage, then buy ${rq.next.name} and chase gear drops.`
      : 'Runs are stable and fast and your priority runes are bought — advance and farm gear drops.',
    reasons: [
      `Frontline clears the Armor ${threshold} survival check and party DPS (${Math.round(partyDps).toLocaleString()}) meets the ~${dpsExpectation.toLocaleString()} bar for stage ${stage}.`,
      rq.next
        ? `You can afford the next priority rune (${rq.next.name}, ${fmtGold(rq.next.cost)}g).`
        : 'No outstanding priority runes block you.',
      'When stable & repeating, value shifts to drops/gear — enable auto-open chests and compare loot.',
    ],
    details: { threshold, partyDps, rune: rq.next, dpsExpectation },
  }
}
