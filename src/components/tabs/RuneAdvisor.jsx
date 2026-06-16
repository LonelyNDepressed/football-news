import { runeQueue, fmtGold, num } from '../../lib/calculations.js'
import { Card, Reasoning, Badge, Meter } from '../ui.jsx'

export default function RuneAdvisor({ state }) {
  const gold = num(state.gold)
  const { next, queue, goldReachIndex, canAffordNext } = runeQueue(
    state.ownedRunes,
    gold,
    state.slotsUnlocked,
  )

  const sixDeep = queue.slice(0, 6)

  return (
    <div className="space-y-4">
      <Card
        title="Buy next"
        subtitle="First un-owned rune in the recommended priority order."
        right={
          next ? (
            <Badge severity={canAffordNext ? 'optimize' : 'critical'}>
              {canAffordNext ? 'Affordable now' : `Short ${fmtGold(next.shortBy)}g`}
            </Badge>
          ) : (
            <Badge severity="optimize">All priority runes owned</Badge>
          )
        }
      >
        {next ? (
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-xl text-gold-400">{next.name}</h3>
              <span className="text-lg font-semibold text-slate-100">{fmtGold(next.cost)}g</span>
            </div>
            <p className="mt-1 text-sm text-slate-300">{next.effect}</p>
            <div className="mt-3">
              <Meter
                value={Math.min(gold, next.cost)}
                max={next.cost}
                tone={canAffordNext ? 'good' : 'gold'}
                label="Gold toward this rune"
                sublabel={`${fmtGold(gold)} / ${fmtGold(next.cost)}`}
              />
            </div>
            <Reasoning reasons={[next.why, costNote(next)]} />
          </div>
        ) : (
          <p className="text-sm text-slate-300">
            You own every rune in the priority queue. Shift focus to gear (Item Acquisition) and
            stat optimization.
          </p>
        )}
      </Card>

      <Card
        title="6-deep queue"
        subtitle="Recommended unlock order. The highlighted row is how far your current gold would stretch if you saved and bought straight down the list."
      >
        <div className="space-y-2">
          {sixDeep.map((r, i) => {
            const reachable = goldReachIndex >= i
            return (
              <div
                key={r.id}
                className={`rounded-xl border p-3 transition ${
                  i === 0
                    ? 'border-gold-500/50 bg-gold-500/10'
                    : reachable
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-navy-700 bg-navy-850/40'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-700 text-xs font-bold text-gold-400">
                    {i + 1}
                  </span>
                  <span className="font-semibold text-slate-100">{r.name}</span>
                  <span className="text-xs text-slate-500">{r.category}</span>
                  {!r.confirmed && (
                    <span className="text-[10px] text-slate-600" title="Community estimate">
                      cost approx
                    </span>
                  )}
                  <span className="ml-auto text-sm font-medium text-slate-200">
                    {fmtGold(r.cost)}g
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400">{r.effect}</span>
                  <span className="ml-auto text-slate-500">
                    cumulative {fmtGold(r.cumulativeCost)}g
                  </span>
                  {r.affordableNow ? (
                    <Badge severity="optimize">can buy now</Badge>
                  ) : reachable ? (
                    <Badge severity="progress">save in sequence</Badge>
                  ) : (
                    <Badge severity="critical">out of reach</Badge>
                  )}
                </div>
              </div>
            )
          })}
          {sixDeep.length === 0 && (
            <p className="text-sm text-slate-400">No remaining runes in the priority queue.</p>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-navy-700 bg-navy-850/50 p-3 text-sm text-slate-300">
          {goldReachIndex < 0 ? (
            <>
              Your {fmtGold(gold)}g can't yet cover the next rune ({next ? next.name : '—'}). Farm to
              at least <span className="font-semibold text-gold-400">{next ? fmtGold(next.cost) : '—'}g</span>.
            </>
          ) : (
            <>
              Your {fmtGold(gold)}g stretches through{' '}
              <span className="font-semibold text-gold-400">
                {goldReachIndex + 1} rune{goldReachIndex > 0 ? 's' : ''}
              </span>{' '}
              ({sixDeep.slice(0, goldReachIndex + 1).map((r) => r.name).join(', ')}) if you buy
              straight down the list.
            </>
          )}
        </div>
      </Card>

      <Card title="Why this order" subtitle="Order matters more than raw power — these runes are gold-gated gateways.">
        <Reasoning
          reasons={[
            'Rune of War is the gateway — nothing else unlocks without it.',
            'Command I (2nd hero slot) is the biggest early spike: a second hero roughly doubles output for ~2K gold.',
            'Command II (3rd slot) completes the comp; Awakening then gives every hero a 2nd skill.',
            'Auto-open chests automate idle loot; wealth runes compound the gold that funds everything after.',
            'Growth/XP and Offline runes accelerate progress; combat-stat and drop-rate runes come last because gear out-scales them.',
          ]}
        />
      </Card>
    </div>
  )
}

function costNote(rune) {
  return rune.confirmed
    ? `Cost ${fmtGold(rune.cost)}g (confirmed).`
    : `Cost ~${fmtGold(rune.cost)}g (community estimate — verify in-game).`
}
