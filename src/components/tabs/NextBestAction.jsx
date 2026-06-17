import { nextBestAction } from '../../lib/strategy.js'
import { Card, Reasoning, Badge, StatPill } from '../ui.jsx'
import { fmtGold, num } from '../../lib/calculations.js'

const SEVERITY_LABEL = {
  critical: 'Fix this first',
  progress: 'Progress unlock',
  optimize: 'Optimize',
}

export default function NextBestAction({ state }) {
  const rec = nextBestAction(state)

  const ring =
    rec.severity === 'critical'
      ? 'from-rose-500/20 to-navy-900 border-rose-500/40'
      : rec.severity === 'optimize'
        ? 'from-emerald-500/15 to-navy-900 border-emerald-500/40'
        : 'from-gold-500/15 to-navy-900 border-gold-500/40'

  return (
    <div className="space-y-4">
      <section className={`rounded-2xl border bg-gradient-to-br ${ring} p-6 shadow-glow`}>
        <div className="flex items-center gap-2">
          <Badge severity={rec.severity}>{SEVERITY_LABEL[rec.severity]}</Badge>
          <span className="text-xs text-slate-400">Next Best Action</span>
        </div>
        <h2 className="mt-3 text-2xl text-slate-50 sm:text-3xl">{rec.verdict}</h2>
        <p className="mt-2 max-w-3xl text-slate-300">{rec.action}</p>
        <Reasoning reasons={rec.reasons} />
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPill
          label="Stage Threshold"
          value={num(rec.details?.threshold)}
          hint={`Armor for 50% reduction (14×${num(state.stageLevel)}+12)`}
        />
        <StatPill
          label="Party DPS"
          value={rec.details?.partyDps ? Math.round(rec.details.partyDps).toLocaleString() : '—'}
          hint="Sum of owned-hero DPS scores"
        />
        <StatPill
          label="Hero Slots"
          value={`${num(state.slotsUnlocked)} / 3`}
          hint="Unlock with Command runes"
        />
        <StatPill
          label="Gold"
          value={fmtGold(state.gold)}
          hint={rec.details?.rune ? `Next: ${rec.details.rune.name}` : 'Banked'}
        />
      </div>

      <Card
        title="How this verdict is reached"
        subtitle="The strategist runs the same triage every time — survival, then progression, then economy, then optimization."
      >
        <ol className="space-y-2 text-sm text-slate-300">
          <Step n={1} label="Roster check">
            Are heroes selected with stats entered? If not, that comes first.
          </Step>
          <Step n={2} label="Slot spike">
            Slots &lt; 3 and the next Command rune is affordable? Unlocking a hero slot beats almost
            everything.
          </Step>
          <Step n={3} label="Survival (failing runs)">
            Frontline Armor below the stage threshold (14×stage+12) or HP too thin → farm Armor/HP.
          </Step>
          <Step n={4} label="Economy (stable but broke)">
            Survivable but can&apos;t afford the next structural rune → gold farm.
          </Step>
          <Step n={5} label="Speed (safe but slow)">
            Survivable and funded but party DPS lags the stage → XP farm to out-level it.
          </Step>
          <Step n={6} label="Push & optimize">
            Stable, fast, funded → advance the stage and chase gear drops.
          </Step>
        </ol>
      </Card>
    </div>
  )
}

function Step({ n, label, children }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-700 text-xs font-bold text-gold-400">
        {n}
      </span>
      <span>
        <span className="font-semibold text-slate-200">{label}.</span> {children}
      </span>
    </li>
  )
}
