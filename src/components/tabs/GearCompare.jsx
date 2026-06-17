import { useState } from 'react'
import { GEAR_SLOTS, RARITIES } from '../../data/gameData.js'
import { num, fmt } from '../../lib/calculations.js'
import { Card, Reasoning, Badge, Meter } from '../ui.jsx'

// Stat fields the comparer scores. baseWeight is the generic value;
// dpsWeight is used on DPS slots (weapons / offensive off-hands).
const STAT_DEFS = [
  { key: 'AttackDamage', label: 'Attack Damage', baseWeight: 1.0, dpsWeight: 2.4 },
  { key: 'AttackSpeed', label: 'Attack Speed', baseWeight: 1.2, dpsWeight: 3.0 },
  { key: 'CritChance', label: 'Crit Chance %', baseWeight: 1.5, dpsWeight: 2.8 },
  { key: 'CritDamage', label: 'Crit Damage %', baseWeight: 0.8, dpsWeight: 1.8 },
  { key: 'MaxHP', label: 'Max HP', baseWeight: 0.5, dpsWeight: 0.25 },
  { key: 'Armor', label: 'Armor', baseWeight: 1.4, dpsWeight: 0.4 },
  { key: 'ElementResist', label: 'Element Resist', baseWeight: 1.1, dpsWeight: 0.3 },
]

const RARITY_MULT = Object.fromEntries(RARITIES.map((r, i) => [r, 1 + i * 0.15]))

function emptyItem() {
  return {
    name: '',
    slot: 'sword',
    rarity: 'Common',
    stats: Object.fromEntries(STAT_DEFS.map((d) => [d.key, ''])),
  }
}

function scoreItem(item) {
  const slot = GEAR_SLOTS.find((s) => s.id === item.slot)
  const isDps = slot?.dps
  let raw = 0
  const breakdown = []
  for (const d of STAT_DEFS) {
    const v = num(item.stats[d.key])
    if (!v) continue
    const w = isDps ? d.dpsWeight : d.baseWeight
    const contrib = v * w
    raw += contrib
    breakdown.push({ key: d.key, label: d.label, value: v, weight: w, contrib })
  }
  breakdown.sort((a, b) => b.contrib - a.contrib)
  const rarityMult = RARITY_MULT[item.rarity] || 1
  return { raw, total: raw * rarityMult, rarityMult, breakdown, isDps, slotName: slot?.name }
}

export default function GearCompare() {
  const [a, setA] = useState(() => ({ ...emptyItem(), name: 'Item A' }))
  const [b, setB] = useState(() => ({ ...emptyItem(), name: 'Item B' }))

  const sa = scoreItem(a)
  const sb = scoreItem(b)
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
        subtitle="Enter two items' stats and the strategist scores each by weighted combat value, then declares a winner. DPS slots weight offensive stats much higher."
      >
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
                    <span className="font-semibold text-gold-400">{margin}%</span>.
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
                `Each stat is multiplied by a role weight, summed, then scaled by rarity (${RARITIES[0]}=1.0× up to ${RARITIES[RARITIES.length - 1]}=${RARITY_MULT[RARITIES[RARITIES.length - 1]].toFixed(2)}×).`,
                'On DPS slots (weapons, offensive off-hands) Attack Speed and Crit are weighted ~2-3× because the damage formula multiplies them; HP/Armor are downweighted.',
                'On armor/jewelry slots, defensive stats (Armor, resist, HP) carry more weight.',
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
          Score {score.isDps ? '(DPS-weighted)' : '(defense-weighted)'}
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
