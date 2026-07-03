// Small shared presentational primitives.

export function Card({ title, subtitle, children, className = '', right }) {
  return (
    <section className={`card ${className}`}>
      {(title || right) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-lg text-gold-400">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  )
}

const SEVERITY_STYLES = {
  critical: 'border-rose-500/50 bg-rose-500/10 text-rose-200',
  progress: 'border-gold-500/50 bg-gold-500/10 text-gold-200',
  optimize: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200',
}

export function Badge({ children, severity = 'progress', className = '' }) {
  return (
    <span className={`chip ${SEVERITY_STYLES[severity] || SEVERITY_STYLES.progress} ${className}`}>
      {children}
    </span>
  )
}

// "Why" block — the strategist is never a black box.
export function Reasoning({ reasons = [], title = 'Why' }) {
  if (!reasons.length) return null
  return (
    <div className="mt-3 rounded-xl border border-navy-700/70 bg-navy-850/60 p-3">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </p>
      <ul className="space-y-1.5 text-sm text-slate-300">
        {reasons.map((r, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Meter({ value = 0, max = 1, label, sublabel, tone = 'gold' }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100))
  const fill =
    tone === 'good'
      ? 'bg-emerald-500'
      : tone === 'bad'
        ? 'bg-rose-500'
        : 'bg-gold-500'
  return (
    <div>
      {(label || sublabel) && (
        <div className="mb-1 flex items-baseline justify-between text-xs">
          <span className="text-slate-400">{label}</span>
          <span className="font-medium text-slate-300">{sublabel}</span>
        </div>
      )}
      <div className="stat-bar-track">
        <div className={`h-full rounded-full ${fill} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function StatPill({ label, value, hint }) {
  return (
    <div className="pill">
      <div className="text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-0.5 text-base font-semibold text-slate-100">{value}</div>
      {hint && <div className="text-[11px] text-slate-500">{hint}</div>}
    </div>
  )
}

export function EmptyState({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-navy-700 bg-navy-850/40 p-6 text-center text-sm text-slate-400">
      {children}
    </div>
  )
}
