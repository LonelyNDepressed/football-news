import { useState } from 'react'
import { usePlayerState } from './hooks/usePlayerState.js'
import TopBar from './components/TopBar.jsx'
import Footer from './components/Footer.jsx'
import NextBestAction from './components/tabs/NextBestAction.jsx'
import HeroBuilds from './components/tabs/HeroBuilds.jsx'
import FarmingAdvisor from './components/tabs/FarmingAdvisor.jsx'
import RuneAdvisor from './components/tabs/RuneAdvisor.jsx'
import GearCompare from './components/tabs/GearCompare.jsx'
import ItemGuide from './components/tabs/ItemGuide.jsx'

const TABS = [
  { id: 'next', label: 'Next Best Action', icon: '🎯', Component: NextBestAction, needsState: true },
  { id: 'heroes', label: 'Per-Hero Builds', icon: '⚔️', Component: HeroBuilds, needsState: true },
  { id: 'farming', label: 'Farming Advisor', icon: '🌾', Component: FarmingAdvisor, needsState: true },
  { id: 'runes', label: 'Rune Advisor', icon: '🔮', Component: RuneAdvisor, needsState: true },
  { id: 'gear', label: 'Gear Compare', icon: '🛡️', Component: GearCompare, needsState: false },
  { id: 'items', label: 'Item Guide', icon: '🧊', Component: ItemGuide, needsState: false },
]

export default function App() {
  const player = usePlayerState()
  const [active, setActive] = useState('next')
  const [showGuide, setShowGuide] = useState(player.state.ownedHeroes.length === 0)

  const ActiveTab = TABS.find((t) => t.id === active) || TABS[0]
  const { Component } = ActiveTab

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar {...player} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5">
        {showGuide && (
          <QuickStart onClose={() => setShowGuide(false)} goTo={setActive} state={player.state} />
        )}

        {/* Tab nav */}
        <nav className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-navy-700/70 bg-navy-900/60 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active === t.id
                  ? 'bg-gold-500/15 text-gold-300 shadow-glow'
                  : 'text-slate-400 hover:bg-navy-800 hover:text-slate-200'
              }`}
            >
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </nav>

        <Component state={player.state} />
      </main>

      <Footer />
    </div>
  )
}

function QuickStart({ onClose, goTo, state }) {
  const hasHeroes = state.ownedHeroes.length > 0
  return (
    <div className="mb-5 rounded-2xl border border-gold-500/40 bg-gradient-to-br from-gold-500/10 to-navy-900 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl text-gold-300">Welcome, strategist 👋</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-300">
            This dashboard turns your manually-entered progress into the single fastest next step.
            Works for brand-new players and veterans alike — start here:
          </p>
        </div>
        <button onClick={onClose} className="shrink-0 text-sm text-slate-400 hover:text-slate-200">
          Dismiss ✕
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PathCard
          step="1"
          title="New player?"
          body="Open Edit inputs (top bar), pick the heroes you own, and enter their stats. Even rough numbers work."
          action="Edit inputs ↑"
          onClick={onClose}
        />
        <PathCard
          step="2"
          title="Returning player?"
          body="Your inputs auto-saved last time. Update your gold, stage, and any new heroes, then check your verdict."
          action="See Next Best Action"
          onClick={() => goTo('next')}
        />
        <PathCard
          step="3"
          title="Just optimizing?"
          body="Compare two gear drops or read the rune priority and item-acquisition routes directly."
          action="Open Gear Compare"
          onClick={() => goTo('gear')}
        />
      </div>

      {!hasHeroes && (
        <p className="mt-3 text-xs text-amber-200/80">
          Tip: the Next Best Action, Hero Builds, and Farming tabs need at least one owned hero with
          stats entered. Gear Compare and the Item Guide work without any input.
        </p>
      )}
    </div>
  )
}

function PathCard({ step, title, body, action, onClick }) {
  return (
    <div className="flex flex-col rounded-xl border border-navy-700 bg-navy-850/50 p-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-500/20 text-xs font-bold text-gold-300">
          {step}
        </span>
        <h3 className="text-base text-slate-100">{title}</h3>
      </div>
      <p className="flex-1 text-sm text-slate-400">{body}</p>
      <button
        onClick={onClick}
        className="mt-3 self-start rounded-lg border border-gold-600/50 bg-gold-500/10 px-3 py-1.5 text-xs font-medium text-gold-300 transition hover:bg-gold-500/20"
      >
        {action}
      </button>
    </div>
  )
}
