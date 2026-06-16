# TBH Strategist

A companion / optimization dashboard for the idle game **TBH: Task Bar Hero**. Enter your progress
manually and the app computes the fastest path to advance: a single Next Best Action, per-hero stat
builds with live DPS scores, farming guidance (XP vs gold + armor survival breakpoints), rune
unlock priority, gear comparison, and an item-acquisition guide.

Built with **Vite + React + Tailwind**. Every recommendation shows its reasoning — it's a
strategist, not a black box.

## Run it

```bash
npm install
npm run dev      # start the dev server (Vite prints the local URL)
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## How it works

- **All input is manual.** The game save
  (`%USERPROFILE%\AppData\LocalLow\TesseractStudio\TaskbarHero\SaveFile_Live.es3`) is an Easy Save 3
  encrypted Unity file. This tool never reads or writes it.
- Your inputs persist to `localStorage`, so progress survives reloads. Nothing is uploaded.
- This is a strategy advisor only — it computes recommendations from the numbers you enter. It is
  not a cheat or memory-injector.

## Tabs

1. **Next Best Action** — one headline recommendation from a survival → progression → economy →
   optimization triage, with the reasoning shown.
2. **Per-Hero Builds** — formation, role-based stat priority, recommended skills, and a live DPS
   score per owned hero. Uses `DPS = AttackSpeed × AttackDamage × (1 + CritChance × (CritDamage − 1))`.
3. **Farming Advisor** — XP-vs-gold focus call, armor survival threshold (`14×stage + 12`) with
   50%/75% breakpoints, and offline-reward math (8h cap, +10% per Offline rune).
4. **Rune Advisor** — buy-next, a 6-deep priority queue, affordability, and how far your gold
   stretches down the list.
5. **Gear Compare** — score two items by weighted combat value (DPS slots weight offense highest)
   and declare a winner.
6. **Item Guide** — chest-drop routes and the Cube's 8 operations, plus the rarity ladder.

## Project structure

```
src/
  data/gameData.js      # heroes, abilities, runes, slots, cube ops, constants
  lib/calculations.js   # pure game math (DPS, armor, offline, rune queue, formatting)
  lib/strategy.js       # Next Best Action decision tree
  hooks/usePlayerState.js  # localStorage-backed player state
  components/           # TopBar, Footer, shared UI primitives
  components/tabs/      # one file per tab
```

> Game data is fan-datamined and may shift with patches. Back up your `.es3` save before anything
> experimental. Rune costs marked "approx" are community estimates — verify in-game.
