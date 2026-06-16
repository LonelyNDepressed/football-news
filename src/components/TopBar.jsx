import { useState } from 'react'
import {
  HEROES,
  RUNES,
  ACTS,
  MAX_HERO_LEVEL,
  MAX_STAGE_LEVEL,
} from '../data/gameData.js'
import { fmtGold, num } from '../lib/calculations.js'

const STAT_FIELDS = [
  { key: 'AttackDamage', label: 'Atk Dmg' },
  { key: 'AttackSpeed', label: 'Atk Speed' },
  { key: 'CritChance', label: 'Crit %' },
  { key: 'CritDamage', label: 'Crit Dmg %' },
  { key: 'MaxHP', label: 'Max HP' },
  { key: 'Armor', label: 'Armor' },
]

function NumberField({ label, value, onChange, min, max, suffix }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <div className="relative">
        <input
          type="number"
          className="field-input"
          value={value ?? ''}
          min={min}
          max={max}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
            {suffix}
          </span>
        )}
      </div>
    </label>
  )
}

export default function TopBar({ state, update, toggleHero, setHeroStat, toggleRune, reset }) {
  const [open, setOpen] = useState(true)
  const [showRunes, setShowRunes] = useState(false)

  const ownedCount = state.ownedHeroes.length

  return (
    <div className="sticky top-0 z-30 border-b border-navy-700/70 bg-navy-950/85 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3">
        {/* Always-visible compact summary row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <div>
              <h1 className="text-lg leading-none text-gold-400">TBH Strategist</h1>
              <p className="text-[11px] text-slate-500">Task Bar Hero companion</p>
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2 text-sm">
            <span className="pill">
              <span className="text-slate-400">Gold</span>{' '}
              <span className="font-semibold text-gold-400">{fmtGold(state.gold)}</span>
            </span>
            <span className="pill">
              <span className="text-slate-400">Lv</span>{' '}
              <span className="font-semibold text-slate-100">{num(state.heroLevel)}</span>
            </span>
            <span className="pill">
              <span className="text-slate-400">Stage</span>{' '}
              <span className="font-semibold text-slate-100">{num(state.stageLevel)}</span>
            </span>
            <span className="pill">
              <span className="text-slate-400">Slots</span>{' '}
              <span className="font-semibold text-slate-100">{num(state.slotsUnlocked)}/3</span>
            </span>
            <span className="pill">
              <span className="text-slate-400">Heroes</span>{' '}
              <span className="font-semibold text-slate-100">{ownedCount}</span>
            </span>
            <button
              onClick={() => setOpen((o) => !o)}
              className="rounded-lg border border-gold-600/60 bg-gold-500/10 px-3 py-2 text-sm font-medium text-gold-300 transition hover:bg-gold-500/20"
            >
              {open ? 'Hide inputs ▲' : 'Edit inputs ▼'}
            </button>
          </div>
        </div>

        {open && (
          <div className="mt-4 space-y-4">
            {/* Core numeric inputs */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <NumberField
                label="Current Gold"
                value={state.gold}
                min={0}
                onChange={(v) => update({ gold: v })}
              />
              <NumberField
                label="Hero Level"
                value={state.heroLevel}
                min={1}
                max={MAX_HERO_LEVEL}
                onChange={(v) => update({ heroLevel: clamp(v, 1, MAX_HERO_LEVEL) })}
              />
              <label className="block">
                <span className="field-label">Act</span>
                <select
                  className="field-input"
                  value={state.actId}
                  onChange={(e) => update({ actId: e.target.value })}
                >
                  {ACTS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="field-label">Difficulty</span>
                <select
                  className="field-input"
                  value={state.difficulty}
                  onChange={(e) => update({ difficulty: e.target.value })}
                >
                  {(ACTS.find((a) => a.id === state.actId)?.tiers || ['Normal']).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <NumberField
                label="Stage Level"
                value={state.stageLevel}
                min={1}
                max={MAX_STAGE_LEVEL}
                onChange={(v) => update({ stageLevel: clamp(v, 1, MAX_STAGE_LEVEL) })}
              />
              <label className="block">
                <span className="field-label">Hero Slots Unlocked</span>
                <select
                  className="field-input"
                  value={state.slotsUnlocked}
                  onChange={(e) => update({ slotsUnlocked: num(e.target.value) })}
                >
                  {[1, 2, 3].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Hero multi-select */}
            <div>
              <span className="field-label">Owned Heroes — pick any combination</span>
              <div className="flex flex-wrap gap-2">
                {HEROES.map((h) => {
                  const active = state.ownedHeroes.includes(h.id)
                  return (
                    <button
                      key={h.id}
                      onClick={() => toggleHero(h.id)}
                      className={`chip transition ${
                        active
                          ? 'border-gold-500 bg-gold-500/15 text-gold-200'
                          : 'border-navy-700 bg-navy-850 text-slate-400 hover:border-navy-600'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}
                      {h.name}
                      {h.dlc && <span className="ml-1 text-[10px] text-slate-500">DLC</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Per-hero stats */}
            {state.ownedHeroes.length > 0 && (
              <div className="space-y-3">
                <span className="field-label">Per-Hero Stats</span>
                {state.ownedHeroes.map((id) => {
                  const hero = HEROES.find((h) => h.id === id)
                  const s = state.heroStats[id] || {}
                  return (
                    <div
                      key={id}
                      className="rounded-xl border border-navy-700/70 bg-navy-850/40 p-3"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span className="font-semibold text-slate-100">{hero.name}</span>
                        <span className="text-xs text-slate-500">
                          {hero.role} · base HP {hero.baseHp}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                        {STAT_FIELDS.map((f) => (
                          <NumberField
                            key={f.key}
                            label={f.label}
                            value={s[f.key]}
                            min={0}
                            suffix={f.key.startsWith('Crit') ? '%' : undefined}
                            onChange={(v) => setHeroStat(id, f.key, v)}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Rune checklist (collapsible) */}
            <div>
              <button
                onClick={() => setShowRunes((s) => !s)}
                className="field-label flex items-center gap-1 hover:text-slate-200"
              >
                Owned Runes ({state.ownedRunes.length}/{RUNES.length}) {showRunes ? '▲' : '▼'}
              </button>
              {showRunes && (
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                  {RUNES.map((r) => {
                    const owned = state.ownedRunes.includes(r.id)
                    return (
                      <label
                        key={r.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                          owned
                            ? 'border-emerald-500/40 bg-emerald-500/10'
                            : 'border-navy-700 bg-navy-850/50 hover:border-navy-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={owned}
                          onChange={() => toggleRune(r.id)}
                          className="accent-gold-500"
                        />
                        <span className="flex-1 text-slate-200">{r.name}</span>
                        <span className="text-xs text-slate-500">{fmtGold(r.cost)}g</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-navy-800 pt-3">
              <p className="text-xs text-slate-500">
                Inputs auto-save to your browser. Nothing is uploaded.
              </p>
              <button
                onClick={() => {
                  if (confirm('Reset all entered progress? This cannot be undone.')) reset()
                }}
                className="text-xs text-rose-400/80 hover:text-rose-300"
              >
                Reset all data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function clamp(v, min, max) {
  const n = num(v)
  return Math.max(min, Math.min(max, n))
}
