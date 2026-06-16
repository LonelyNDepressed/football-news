import { useState } from 'react'
import { HERO_BY_ID, OFFLINE_CAP_SECONDS } from '../../data/gameData.js'
import {
  num,
  fmt,
  computeDps,
  armorThreshold,
  armorReduction,
  armorBreakpoints,
  clearsFifty,
  clearsSeventyFive,
  offlineReward,
  pct,
} from '../../lib/calculations.js'
import { Card, Reasoning, Badge, Meter, StatPill } from '../ui.jsx'

export default function FarmingAdvisor({ state }) {
  const stage = num(state.stageLevel)
  const threshold = armorThreshold(stage)
  const bp = armorBreakpoints(stage)

  const heroes = state.ownedHeroes.map((id) => ({
    hero: HERO_BY_ID[id],
    s: state.heroStats[id] || {},
  }))
  const bestArmor = Math.max(0, ...heroes.map((h) => num(h.s.Armor)))
  const partyDps = heroes.reduce((sum, h) => sum + computeDps(h.s), 0)

  // XP vs gold recommendation.
  const dpsExpectation = stage * 150
  const survivable = bestArmor >= threshold * 0.6 // soft survivability gate for the focus call
  const slow = partyDps > 0 && partyDps < dpsExpectation
  let focus, focusWhy
  if (!survivable) {
    focus = 'Survivability first'
    focusWhy = `Your best Armor (${fmt(bestArmor)}) is well below the stage threshold (${threshold}). Farm Armor/HP on an easier stage before optimising XP or gold.`
  } else if (slow) {
    focus = 'XP focus'
    focusWhy = `You survive but party DPS (${fmt(partyDps)}) trails the ~${fmt(dpsExpectation)} this stage wants. Levels raise base stats across the squad — out-level the wall, then push.`
  } else {
    focus = 'Gold focus'
    focusWhy = `You clear comfortably (DPS ${fmt(partyDps)} ≥ ~${fmt(dpsExpectation)}). Convert that stability into gold to fund your next rune and gear.`
  }

  return (
    <div className="space-y-4">
      <Card
        title="Farm focus"
        subtitle={`Stage ${stage} · hero level ${num(state.heroLevel)}`}
        right={<Badge severity={focus === 'Gold focus' ? 'optimize' : focus === 'XP focus' ? 'progress' : 'critical'}>{focus}</Badge>}
      >
        <p className="text-slate-300">{focusWhy}</p>
        <Reasoning
          reasons={[
            'XP farm when you survive but kill slowly — leveling is the cheapest DPS you have.',
            'Gold farm when you both survive and clear fast — your bottleneck is your wallet, so monetise the loop.',
            'If you cannot survive, neither XP nor gold matters yet — fix durability first.',
          ]}
        />
      </Card>

      <Card title="Armor survival threshold" subtitle={`Reduction = Armor² / (Armor² + (14×${stage}+12) × (Armor + 0.4×Damage))`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatPill label="50% breakpoint" value={fmt(bp.fiftyPct)} hint="Armor for half physical mitigation" />
          <StatPill label="75% breakpoint (cap)" value={fmt(bp.seventyFivePct)} hint="≈3× threshold — beyond is wasted" />
          <StatPill label="Your best Armor" value={fmt(bestArmor)} hint="Highest Armor in your party" />
        </div>

        <div className="mt-4 space-y-3">
          <BreakpointRow
            label="Clears 50% reduction"
            ok={clearsFifty(bestArmor, stage)}
            need={bp.fiftyPct}
            have={bestArmor}
          />
          <BreakpointRow
            label="Clears 75% cap"
            ok={clearsSeventyFive(bestArmor, stage)}
            need={bp.seventyFivePct}
            have={bestArmor}
          />
          <div>
            <Meter
              value={bestArmor}
              max={bp.seventyFivePct}
              tone={clearsFifty(bestArmor, stage) ? 'good' : 'bad'}
              label="Armor toward the 75% cap"
              sublabel={`${fmt(bestArmor)} / ${fmt(bp.seventyFivePct)}`}
            />
            <p className="mt-1 text-xs text-slate-500">
              Estimated physical reduction at this stage: ~
              <span className="font-semibold text-slate-300">
                {pct(armorReduction(bestArmor, stage))}
              </span>{' '}
              (proxy assumes enemy hit ≈ threshold). Threshold grows +14 per stage level, so
              re-check after every push.
            </p>
          </div>
        </div>
      </Card>

      <OfflineCalculator state={state} />
    </div>
  )
}

function BreakpointRow({ label, ok, need, have }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-850/50 px-3 py-2 text-sm">
      <span className="text-slate-300">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-xs text-slate-500">
          {fmt(have)} / {fmt(need)}
        </span>
        {ok ? <Badge severity="optimize">✓ met</Badge> : <Badge severity="critical">short</Badge>}
      </span>
    </div>
  )
}

function OfflineCalculator({ state }) {
  const [hours, setHours] = useState(8)
  const offlineRuneCount = state.ownedRunes.filter(
    (r) => r === 'offline_gold' || r === 'offline_xp',
  ).length

  const result = offlineReward({
    secondsAway: num(hours) * 3600,
    offlineRuneCount,
    daysAway: num(hours) / 24,
  })

  const capHours = OFFLINE_CAP_SECONDS / 3600
  const capped = num(hours) > capHours

  return (
    <Card
      title="Offline reward math"
      subtitle="Idle rewards cap at 8 hours and scale +10% per Offline Reward rune."
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="field-label">Hours away</span>
          <input
            type="number"
            className="field-input w-32"
            min={0}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        </label>
        <div className="pill">
          <div className="text-[11px] uppercase tracking-wider text-slate-400">Offline runes owned</div>
          <div className="text-base font-semibold text-slate-100">
            {offlineRuneCount} <span className="text-xs text-slate-500">(+{result.bonusPct}%)</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatPill
          label="Credited time"
          value={`${(result.cappedSeconds / 3600).toFixed(1)}h`}
          hint={capped ? `Capped from ${hours}h to 8h` : 'Under the 8h cap'}
        />
        <StatPill
          label="Reward multiplier"
          value={`${result.multiplier.toFixed(2)}×`}
          hint={`Base 1.00× + ${result.bonusPct}% from runes`}
        />
        <StatPill
          label="Effective yield"
          value={result.voided ? '0 (voided)' : `${((result.cappedSeconds / 3600) * result.multiplier).toFixed(1)}h-equiv`}
          hint={result.voided ? 'Anti-tamper: 30+ days = 0' : 'Credited time × multiplier'}
        />
      </div>

      <Reasoning
        reasons={[
          `The cap is hard: ${capHours}h (${OFFLINE_CAP_SECONDS.toLocaleString()}s). Hours beyond that earn nothing — collect at least twice a day to avoid waste.`,
          'Each Offline Reward Gold/EXP rune adds +10%, additive (2 runes = +20%, i.e. 1.20×).',
          'Anti-tamper: being away ~30+ days zeroes the reward entirely.',
          'Offline runes only pay off if you regularly bank a full or near-full session — otherwise spend that gold on slots/wealth first.',
        ]}
      />
    </Card>
  )
}
