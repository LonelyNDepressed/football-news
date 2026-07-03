import { HERO_BY_ID } from '../../data/gameData.js'
import { computeDps, critMultiplier, num } from '../../lib/calculations.js'
import { Card, Reasoning, Badge, Meter, EmptyState } from '../ui.jsx'

const STAT_LABELS = {
  AttackDamage: 'Attack Damage',
  AttackSpeed: 'Attack Speed',
  CritChance: 'Crit Chance',
  CritDamage: 'Crit Damage',
  MaxHP: 'Max HP',
  Armor: 'Armor',
}

const FORMATION_COLOR = {
  Front: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
  Mid: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
  Back: 'border-violet-500/40 bg-violet-500/10 text-violet-200',
}

export default function HeroBuilds({ state }) {
  const heroes = state.ownedHeroes.map((id) => HERO_BY_ID[id]).filter(Boolean)

  if (heroes.length === 0) {
    return (
      <EmptyState>
        Select your owned heroes in the top bar to see recommended formations, stat priorities,
        skill loadouts, and live DPS scores.
      </EmptyState>
    )
  }

  // For relative DPS bars.
  const dpsValues = state.ownedHeroes.map((id) => computeDps(state.heroStats[id] || {}))
  const maxDps = Math.max(1, ...dpsValues)

  return (
    <div className="space-y-4">
      <FormationMap heroes={heroes} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {heroes.map((hero) => {
          const s = state.heroStats[hero.id] || {}
          const dps = computeDps(s)
          const cm = critMultiplier(s)
          return (
            <Card key={hero.id} className="!p-0 overflow-hidden">
              <div className="flex items-start justify-between gap-3 border-b border-navy-700/70 bg-navy-850/50 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg text-gold-400">{hero.name}</h3>
                    {hero.dlc && <Badge severity="progress">DLC</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-400">{hero.role}</p>
                </div>
                <span className={`chip ${FORMATION_COLOR[hero.formation]}`}>
                  {hero.formation} line
                </span>
              </div>

              <div className="space-y-4 p-4">
                <p className="text-sm text-slate-300">{hero.blurb}</p>

                {/* DPS score */}
                <div className="rounded-xl border border-navy-700/70 bg-navy-850/50 p-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-wider text-slate-400">
                      Live DPS Score
                    </span>
                    <span className="text-xl font-bold text-gold-400">
                      {Math.round(dps).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2">
                    <Meter value={dps} max={maxDps} tone="gold" />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    AS {num(s.AttackSpeed) || 0} × AD {num(s.AttackDamage) || 0} × crit{' '}
                    {cm.toFixed(2)}× ={' '}
                    {dps > 0 ? Math.round(dps).toLocaleString() : 'enter stats to compute'}
                  </p>
                </div>

                {/* Priority stats */}
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Stat priority ({hero.role})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {hero.priorityStats.map((stat, i) => (
                      <span
                        key={stat}
                        className={`chip ${
                          i === 0
                            ? 'border-gold-500 bg-gold-500/15 text-gold-200'
                            : 'border-navy-700 bg-navy-850 text-slate-300'
                        }`}
                      >
                        {i + 1}. {STAT_LABELS[stat] || stat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Skill loadout */}
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Recommended skill loadout
                  </p>
                  <ul className="space-y-1.5">
                    {Object.entries(hero.recommended).map(([ability, why]) => {
                      const topTier = /TOP-TIER/.test(why)
                      return (
                        <li
                          key={ability}
                          className={`rounded-lg border px-3 py-2 text-sm ${
                            topTier
                              ? 'border-gold-500/60 bg-gold-500/10'
                              : 'border-navy-700 bg-navy-850/50'
                          }`}
                        >
                          <span className="font-semibold text-slate-100">{ability}</span>
                          {topTier && <span className="ml-2">⭐</span>}
                          <span className="block text-xs text-slate-400">{why}</span>
                        </li>
                      )
                    })}
                  </ul>
                  <details className="mt-2 text-xs text-slate-500">
                    <summary className="cursor-pointer hover:text-slate-300">
                      Full ability list ({hero.abilities.length})
                    </summary>
                    <p className="mt-1">{hero.abilities.join(' · ')}</p>
                  </details>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card title="Reading these builds" subtitle="The logic behind every recommendation.">
        <Reasoning
          title="Principles"
          reasons={[
            'Formation: Knight & Slayer hold the Front, Priest sits Mid (heal/buff range), and Ranger/Hunter/Sorcerer stay Back where their low HP is protected.',
            'DPS heroes prioritise Attack Speed → Crit → Attack Damage, because the formula multiplies all three and Attack Speed has no cap.',
            'Tanks prioritise Max HP → Armor → resistances to clear the stage survival threshold.',
            "Priest's Blessing of Might buffs the WHOLE party's damage — it is the highest-value single skill in the game; always slot it.",
            'DPS Score uses the exact in-game formula: AttackSpeed × AttackDamage × (1 + CritChance × (CritDamage − 1)).',
          ]}
        />
      </Card>
    </div>
  )
}

function FormationMap({ heroes }) {
  const lines = { Front: [], Mid: [], Back: [] }
  heroes.forEach((h) => lines[h.formation].push(h))
  return (
    <Card title="Formation" subtitle="Where each owned hero should stand. Enemies approach from the left.">
      <div className="grid grid-cols-3 gap-3">
        {['Front', 'Mid', 'Back'].map((line) => (
          <div key={line} className="rounded-xl border border-navy-700/70 bg-navy-850/40 p-3">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
              {line}
            </p>
            <div className="space-y-1.5">
              {lines[line].length === 0 ? (
                <p className="text-center text-xs text-slate-600">—</p>
              ) : (
                lines[line].map((h) => (
                  <div
                    key={h.id}
                    className={`chip w-full justify-center ${FORMATION_COLOR[line]}`}
                  >
                    {h.name}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
