import { useState } from 'react'
import { GEAR_SLOTS, RARITIES } from '../../data/gameData.js'
import { fmt } from '../../lib/calculations.js'
import { STAT_DEFS, RARITY_MULT, scoreItem, survivalPressure } from '../../lib/gear.js'
import { Card, Reasoning, Badge, Meter } from '../ui.jsx'

function emptyItem() {
  return {
    name: '',
    slot: 'sword',
    rarity: 'Common',
    stats: Object.fromEntries(STAT_DEFS.map((d) => [d.key, ''])),
  }
}

export default function GearCompare({ state }) {
  const [a, setA] = useState(() => ({ ...emptyItem(), name: 'Item A' }))
  const [b, setB] = useState(() => ({ ...emptyItem(), name: 'Item B' }))

  // Stage-aware: the same two items can pick a different winner at stage 5 vs 80
  // because survival matters more as the threshold grows.
  const pressure = survivalPressure(state)
  const p = pressure.p

  const sa = scoreItem(a, p)
  const sb = scoreItem(b, p)
  const maxTotal = Math.max(1, sa.total, sb.total)
  const hasData = sa.total > 0 || sb.total > 0
  const winner = sa.total === sb.total ? null : sa.total > sb.total ? 'A' : 'B'
  const margin =
    hasData && winner
      ? Math.round((Math.abs(sa.total - sb.total) / Math.min(sa.total, sb.total || 1)) * 100)
      : 0

  return (
    <div className="space-y-4">
      <Card
        title="Gear compare"
        subtitle="Enter two items' stats and the strategist scores each by weighted combat value, then declares a winner."
        right={
          <Badge severity={pressure.tone === 'bad' ? 'critical' : pressure.tone === 'good' ? 'optimize' : 'progress'}>
            Stage {pressure.stage} · {pressure.label}
          </Badge>
        }
      >
        <p className="mb-3 text-xs text-slate-400">
          Scoring is tuned to your current stage: at{' '}
          <span className="font-semibold text-slate-200">{pressure.label.toLowerCase()}</span> pressure,
          {pressure.p >= 0.5
            ? ' defensive stats (HP/Armor/resist) are weighted up because you are near or under the survival threshold.'
            : ' offensive stats (Attack Speed/Crit/Damage) are weighted up because you comfortably survive this stage.'}
          {!pressure.hasStats && ' Enter your heroes’ Armor/HP in the top bar for a personalized read.'}
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ItemEditor item={a} onChange={setA} score={sa} highlight={winner === 'A'} />
          <ItemEditor item={b} onChange={setB} score={sb} highlight={winner === 'B'} />
        </div>
      </Card>

      <Card title="Verdict">
        {!hasData ? (
          <p className="text-sm text-slate-400">Enter at least one stat on an item to compare.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {winner ? (
                <>
                  <Badge severity="optimize">
                    Winner: {(winner === 'A' ? a.name : b.name) || `Item ${winner}`}
                  </Badge>
                  <span className="text-sm text-slate-300">
                    Higher weighted combat value by{' '}
                    <span className="font-semibold text-gold-400">{margin}%</span> at stage {pressure.stage}.
                  </span>
                </>
              ) : (
                <Badge severity="progress">It&apos;s a tie — pick on secondary stats or set bonuses</Badge>
              )}
            </div>

            <div className="space-y-3">
              <ScoreRow name={a.name || 'Item A'} score={sa} max={maxTotal} win={winner === 'A'} />
              <ScoreRow name={b.name || 'Item B'} score={sb} max={maxTotal} win={winner === 'B'} />
            </div>

            <Reasoning
              reasons={[
                `Each stat is multiplied by a stage-aware role weight, summed, then scaled by rarity (${RARITIES[0]}=1.0× up to ${RARITIES[RARITIES.length - 1]}=${RARITY_MULT[RARITIES[RARITIES.length - 1]].toFixed(2)}×).`,
                'On DPS slots (weapons, offensive off-hands) Attack Speed and Crit are weighted highest because the damage formula multiplies them.',
                pressure.p >= 0.5
                  ? `At stage ${pressure.stage} you are ${pressure.label.toLowerCase()} (armor threshold ${pressure.threshold}), so HP/Armor/resist are pulled UP in the scoring.`
                  : `At stage ${pressure.stage} you survive comfortably, so offensive stats are pulled UP and defense is discounted.`,
                'No gear lock exists in TBH — always run this comparison before crafting or replacing an equipped item.',
              ]}
            />
          </div>
        )}
      </Card>
    </div>
  )
}

function ItemEditor({ item, onChange, score, highlight }) {
  const set = (patch) => onChange({ ...item, ...patch })
  const setStat = (key, value) => onChange({ ...item, stats: { ...item.stats, [key]: value } })

  return (
    <div
      className={`rounded-xl border p-4 transition ${
        highlight ? 'border-gold-500/60 bg-gold-500/5' : 'border-navy-700 bg-navy-850/40'
      }`}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="block sm:col-span-3">
          <span className="field-label">Item name</span>
          <input
            className="field-input"
            value={item.name}
            placeholder="e.g. Dawnbreaker"
            onChange={(e) => set({ name: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="field-label">Slot</span>
          <select className="field-input" value={item.slot} onChange={(e) => set({ slot: e.target.value })}>
            {GEAR_SLOTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.dps ? ' (DPS)' : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="field-label">Rarity</span>
          <select
            className="field-input"
            value={item.rarity}
            onChange={(e) => set({ rarity: e.target.value })}
          >
            {RARITIES.map((r) => (
              <option key={r} value={r}>
                {r} (×{(RARITY_MULT[r]).toFixed(2)})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {STAT_DEFS.map((d) => (
          <label key={d.key} className="block">
            <span className="field-label">{d.label}</span>
            <input
              type="number"
              className="field-input"
              value={item.stats[d.key]}
              min={0}
              onChange={(e) => setStat(d.key, e.target.value)}
            />
          </label>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg border border-navy-700 bg-navy-900/60 px-3 py-2">
        <span className="text-xs uppercase tracking-wider text-slate-400">
          Score {score.isDps ? '(DPS slot)' : '(defensive slot)'}
        </span>
        <span className="text-lg font-bold text-gold-400">{fmt(score.total)}</span>
      </div>
    </div>
  )
}

function ScoreRow({ name, score, max, win }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className={win ? 'font-semibold text-gold-300' : 'text-slate-300'}>
          {name} {win && '🏆'}
        </span>
        <span className="text-slate-400">
          {fmt(score.total)}{' '}
          <span className="text-xs text-slate-600">
            ({fmt(score.raw)} × {score.rarityMult.toFixed(2)} rarity)
          </span>
        </span>
      </div>
      <Meter value={score.total} max={max} tone={win ? 'good' : 'gold'} />
      {score.breakdown.length > 0 && (
        <p className="mt-1 text-xs text-slate-500">
          Top contributors:{' '}
          {score.breakdown
            .slice(0, 3)
            .map((x) => `${x.label} (${fmt(x.contrib)})`)
            .join(', ')}
        </p>
      )}
    </div>
  )
}
