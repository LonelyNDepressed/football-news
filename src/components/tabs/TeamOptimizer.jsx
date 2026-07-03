import { bestComp, compGap } from '../../lib/comp.js'
import { computeDps, num, fmt } from '../../lib/calculations.js'
import { Card, Reasoning, Badge, Meter, EmptyState } from '../ui.jsx'

const FORMATION_COLOR = {
  Front: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
  Mid: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
  Back: 'border-violet-500/40 bg-violet-500/10 text-violet-200',
}

export default function TeamOptimizer({ state }) {
  if (state.ownedHeroes.length === 0) {
    return (
      <EmptyState>
        Select the heroes you own in the top bar. The optimizer will pick the single strongest party
        you can field with your unlocked slots — and tell you what to chase next.
      </EmptyState>
    )
  }

  const { best, ranked, bench, size } = bestComp(
    state.ownedHeroes,
    state.slotsUnlocked,
    state.heroStats,
  )
  const gap = compGap(best)
  const maxScore = Math.max(1, ...ranked.map((r) => r.score))

  return (
    <div className="space-y-4">
      <Card
        title="Your best party"
        subtitle={`Strongest ${size}-hero comp from the ${state.ownedHeroes.length} hero${state.ownedHeroes.length > 1 ? 'es' : ''} you own, across ${num(state.slotsUnlocked)} unlocked slot${num(state.slotsUnlocked) > 1 ? 's' : ''}.`}
        right={<Badge severity="optimize">Recommended</Badge>}
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {best.heroes.map((h) => {
            const dps = computeDps(state.heroStats[h.id] || {})
            return (
              <div key={h.id} className="rounded-xl border border-navy-700 bg-navy-850/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-100">{h.name}</span>
                  <span className={`chip ${FORMATION_COLOR[h.formation]}`}>{h.formation}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{h.role}</p>
                <p className="mt-2 text-sm">
                  <span className="text-slate-500">DPS </span>
                  <span className="font-semibold text-gold-400">
                    {dps > 0 ? Math.round(dps).toLocaleString() : '—'}
                  </span>
                </p>
              </div>
            )
          })}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Party DPS" value={fmt(best.rawDps)} />
          <Stat
            label="Effective DPS"
            value={fmt(best.effectiveDps)}
            hint={best.hasPriest ? `incl. ${Math.round((best.priestSynergy - 1) * 100)}% Priest buff` : 'no support buff'}
          />
          <Stat
            label="Structure"
            value={`${best.hasFront ? 'Front ✓' : 'No front ✗'}${best.hasPriest ? ' · Priest ✓' : ''}`}
          />
        </div>

        <Reasoning
          reasons={[
            best.hasFront
              ? 'Has a front-line anchor (Knight/Slayer) to soak hits so the back line survives.'
              : 'WARNING: no front-line tank/bruiser — every hero takes hits directly. Prioritise getting one.',
            ...best.notes,
            'Comps are ranked by structural soundness first (front line + Priest support), then by effective party DPS.',
          ]}
        />

        {gap && (
          <div className="mt-3 rounded-xl border border-gold-500/30 bg-gold-500/5 p-3 text-sm text-gold-100/90">
            <span className="font-semibold">Next upgrade: </span>
            {gap}
          </div>
        )}
      </Card>

      {bench.length > 0 && (
        <Card title="On the bench" subtitle="Owned heroes that didn't make the cut for this slot count.">
          <div className="flex flex-wrap gap-2">
            {bench.map((h) => (
              <span key={h.id} className="chip border-navy-700 bg-navy-850 text-slate-400">
                {h.name} <span className="text-[10px] text-slate-600">({h.role})</span>
              </span>
            ))}
          </div>
          {num(state.slotsUnlocked) < 3 && (
            <p className="mt-2 text-xs text-slate-500">
              Unlock more hero slots (Rune of Command I/II) to field {3 - num(state.slotsUnlocked)} more
              of these.
            </p>
          )}
        </Card>
      )}

      {ranked.length > 1 && (
        <Card title="All comps, ranked" subtitle="Every party you could field with your current slots.">
          <div className="space-y-2">
            {ranked.slice(0, 8).map((c, i) => (
              <div
                key={c.heroIds.join('-')}
                className={`rounded-lg border p-3 ${
                  i === 0 ? 'border-gold-500/50 bg-gold-500/10' : 'border-navy-700 bg-navy-850/40'
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-navy-700 text-[10px] font-bold text-gold-400">
                      {i + 1}
                    </span>
                    {c.heroes.map((h) => h.name).join(' + ')}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs">
                    {c.hasFront && <Badge severity="optimize">front</Badge>}
                    {c.hasPriest && <Badge severity="progress">priest</Badge>}
                  </span>
                </div>
                <Meter value={c.score} max={maxScore} tone={i === 0 ? 'good' : 'gold'} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
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
