import { CUBE_OPERATIONS, RARITIES } from '../../data/gameData.js'
import { Card, Reasoning, Badge } from '../ui.jsx'

const TIER_BADGE = {
  early: { severity: 'optimize', label: 'Strong early' },
  mid: { severity: 'progress', label: 'Mid game' },
  late: { severity: 'critical', label: 'Late / niche' },
}

export default function ItemGuide() {
  return (
    <div className="space-y-4">
      <Card title="How to get gear" subtitle="Two routes feed your inventory: chest drops and the Cube.">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Route
            icon="📦"
            title="Stage & boss chest drops"
            points={[
              'Clearing stages drops common chests; bosses drop higher-tier boss chests.',
              'Buy Auto-Open Common, then Auto-Open Boss runes so loot opens itself while you idle.',
              'Drop rates are on a /1000 scale (160 = 16%). Flat Drop-Chance runes add to the number; Percent runes multiply it.',
              'Grab Expansion (inventory/stash) runes so auto-opened gear does not overflow and get lost.',
            ]}
          />
          <Route
            icon="🧊"
            title="The Cube (8 operations)"
            points={[
              'A crafting hub with eight operations — your controllable path to specific gear and upgrades.',
              'Alchemy is the strongest early: it turns the flood of duplicate drops into rune gold.',
              'Synthesis is the long game: an Immortal item unlocks Cube Lv10, a Celestial unlocks Cube Lv50.',
              'No gear lock exists — always stat-compare (Gear Compare tab) before crafting over what you wear.',
            ]}
          />
        </div>
      </Card>

      <Card title="The Cube's 8 operations" subtitle="Roughly ordered by when they matter most.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CUBE_OPERATIONS.map((op) => {
            const tb = TIER_BADGE[op.tier]
            return (
              <div
                key={op.name}
                className="rounded-xl border border-navy-700 bg-navy-850/40 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base text-gold-400">{op.name}</h3>
                  <Badge severity={tb.severity}>{tb.label}</Badge>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-200">{op.summary}</p>
                <p className="mt-1 text-sm text-slate-400">{op.detail}</p>
              </div>
            )
          })}
        </div>
        <Reasoning
          reasons={[
            'Early game: feed Alchemy with duplicates → gold → priority runes. This is your fastest acceleration.',
            'Mid game: use Extraction to save good affixes before Offering/selling, then Crafting/Engraving/Inscription to refine keepers.',
            'Late game: Synthesis pushes rarity (Immortal → Cube Lv10, Celestial → Cube Lv50); Decoration and Offering mop up leftovers.',
          ]}
        />
      </Card>

      <Card title="Rarity ladder" subtitle="Context for what to chase, low to high.">
        <div className="flex flex-wrap items-center gap-1.5">
          {RARITIES.map((r, i) => (
            <span key={r} className="flex items-center gap-1.5">
              <span
                className={`chip ${
                  i >= 4
                    ? 'border-gold-500/50 bg-gold-500/10 text-gold-200'
                    : 'border-navy-700 bg-navy-850 text-slate-300'
                }`}
              >
                {r}
              </span>
              {i < RARITIES.length - 1 && <span className="text-slate-600">→</span>}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Immortal and above (highlighted) are the meaningful Cube/Synthesis milestones — Immortal
          unlocks Cube Lv10 and Celestial unlocks Cube Lv50. Higher rarity also lifts an item's score
          multiplier in the Gear Compare tab.
        </p>
      </Card>
    </div>
  )
}

function Route({ icon, title, points }) {
  return (
    <div className="rounded-xl border border-navy-700 bg-navy-850/40 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h3 className="text-base text-gold-400">{title}</h3>
      </div>
      <ul className="space-y-1.5 text-sm text-slate-300">
        {points.map((p, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
