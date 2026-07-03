import {
  SLOT_GROUPS,
  SAMPLE_STAGES,
  slotPriority,
  survivalPressure,
  scoreItem,
} from '../../lib/gear.js'
import { ITEMS, HAS_ITEM_DB } from '../../data/items.js'
import { num } from '../../lib/calculations.js'
import { Card, Reasoning, Badge, Meter } from '../ui.jsx'

const SIDE_COLOR = {
  offense: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
  defense: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
}

export default function GearPriority({ state }) {
  const pressure = survivalPressure(state)

  return (
    <div className="space-y-4">
      <Card
        title="Gear priority by stage"
        subtitle="What to prioritise on each slot right now — and how it shifts as you climb. Uses the real armor threshold (14×stage+12), not a fixed rule."
        right={
          <Badge severity={pressure.tone === 'bad' ? 'critical' : pressure.tone === 'good' ? 'optimize' : 'progress'}>
            Stage {pressure.stage} · {pressure.label}
          </Badge>
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Stage" value={pressure.stage} />
          <Stat label="Armor threshold" value={pressure.threshold} hint="50% reduction point" />
          <Stat
            label="Your best Armor"
            value={pressure.hasStats ? Math.round(pressure.bestArmor) : '—'}
            hint={pressure.hasStats ? `${Math.round((pressure.armorRatio || 0) * 100)}% of threshold` : 'enter stats'}
          />
          <Stat label="Survival pressure" value={`${Math.round(pressure.p * 100)}%`} hint={pressure.label} />
        </div>
        <div className="mt-3">
          <Meter
            value={pressure.p}
            max={1}
            tone={pressure.tone}
            label="Damage-focused ← → Survival-critical"
            sublabel={pressure.label}
          />
        </div>
        {!pressure.hasStats && (
          <p className="mt-2 text-xs text-amber-200/80">
            Enter your heroes’ Armor & HP in the top bar to personalise this — right now it’s a
            stage-based estimate.
          </p>
        )}
      </Card>

      {/* Per-slot priority at the player's current stage */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {SLOT_GROUPS.map((group) => {
          const priority = slotPriority(group.example, pressure.p)
          const maxW = Math.max(...priority.map((s) => s.weight))
          return (
            <Card key={group.id} title={group.title} subtitle={group.slots.join(' · ')}>
              <p className="mb-3 text-xs text-slate-400">{group.note}</p>
              <ul className="space-y-2">
                {priority.map((s, i) => (
                  <li key={s.key}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-navy-700 text-[10px] font-bold text-gold-400">
                          {i + 1}
                        </span>
                        <span className="text-slate-200">{s.label}</span>
                        <span className={`chip ${SIDE_COLOR[s.side]} !px-1.5 !py-0`}>{s.side}</span>
                      </span>
                      <span className="text-xs text-slate-500">weight {s.weight.toFixed(2)}</span>
                    </div>
                    <Meter value={s.weight} max={maxW} tone={s.side === 'defense' ? 'good' : 'gold'} />
                  </li>
                ))}
              </ul>
            </Card>
          )
        })}
      </div>

      {/* How priority shifts as you climb */}
      <Card
        title="How priority shifts as you climb"
        subtitle="Holding your current durability fixed, this is how the top stat on a DPS weapon vs a defensive armor piece changes across stages."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy-700 text-xs uppercase tracking-wider text-slate-400">
                <th className="py-2 pr-3">Stage</th>
                <th className="py-2 pr-3">Threshold</th>
                <th className="py-2 pr-3">Pressure</th>
                <th className="py-2 pr-3">Top on a Weapon</th>
                <th className="py-2">Top on Armor</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_STAGES.map((stg) => {
                const pr = survivalPressure({ ...state, stageLevel: stg })
                const weaponTop = slotPriority('sword', pr.p)[0]
                const armorTop = slotPriority('armor', pr.p)[0]
                const isCurrent = num(state.stageLevel) === stg
                return (
                  <tr
                    key={stg}
                    className={`border-b border-navy-800/60 ${isCurrent ? 'bg-gold-500/5' : ''}`}
                  >
                    <td className="py-2 pr-3 font-medium text-slate-200">
                      {stg}
                      {isCurrent && <span className="ml-1 text-[10px] text-gold-400">you</span>}
                    </td>
                    <td className="py-2 pr-3 text-slate-400">{pr.threshold}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={
                          pr.tone === 'bad'
                            ? 'text-rose-300'
                            : pr.tone === 'good'
                              ? 'text-emerald-300'
                              : 'text-gold-300'
                        }
                      >
                        {Math.round(pr.p * 100)}%
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-slate-300">{weaponTop.label}</td>
                    <td className="py-2 text-slate-300">{armorTop.label}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <Reasoning
          reasons={[
            'The armor survival threshold grows +14 per stage level, so each point of Armor/HP defends against a bigger world — defensive stats climb the priority list as you advance.',
            'Weapons stay damage-first throughout (that is their job), but even there, survival stats gain ground once you fall under the threshold.',
            'This uses YOUR entered Armor/HP where available: the pressure % is how exposed you are at that stage with your current durability.',
          ]}
        />
      </Card>

      <BestItemsSection state={state} pressure={pressure} />
    </div>
  )
}

// Turns on automatically once data/items.js is populated with a real catalog.
function BestItemsSection({ state, pressure }) {
  if (!HAS_ITEM_DB) {
    return (
      <Card title="Best specific items per slot" subtitle="Ready to switch on — needs a datamined item list.">
        <p className="text-sm text-slate-300">
          This section ranks the single best <em>named</em> item for each slot at your current stage.
          It’s intentionally off until a real, fan-datamined item catalog is supplied — inventing item
          stats would give bad advice.
        </p>
        <div className="mt-3 rounded-xl border border-navy-700 bg-navy-850/50 p-3 text-xs text-slate-400">
          To enable it, drop a list into{' '}
          <code className="rounded bg-navy-950 px-1 text-slate-200">src/data/items.js</code> matching the
          documented schema (name, slot, rarity, stats). Everything here then activates with no other
          changes.
        </div>
      </Card>
    )
  }

  // Rank the populated catalog, stage-aware, best per slot.
  const stage = num(state.stageLevel) || 1
  const bySlot = {}
  for (const item of ITEMS) {
    if (item.minStage && item.minStage > stage) continue
    const scored = { ...item, score: scoreItem(item, pressure.p).total }
    if (!bySlot[item.slot] || scored.score > bySlot[item.slot].score) bySlot[item.slot] = scored
  }
  const best = Object.values(bySlot).sort((a, b) => b.score - a.score)

  return (
    <Card title="Best specific items per slot" subtitle={`Top pick per slot at stage ${stage}, from the item catalog.`}>
      <div className="space-y-2">
        {best.map((item) => (
          <div
            key={item.slot}
            className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-850/50 px-3 py-2 text-sm"
          >
            <span>
              <span className="font-semibold text-slate-100">{item.name}</span>{' '}
              <span className="text-xs text-slate-500">
                {item.slot} · {item.rarity}
              </span>
            </span>
            <span className="font-semibold text-gold-400">{Math.round(item.score)}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function Stat({ label, value, hint }) {
  return (
    <div className="pill">
      <div className="text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-0.5 text-base font-semibold text-slate-100">{value}</div>
      {hint && <div className="text-[11px] text-slate-500">{hint}</div>}
    </div>
  )
}
