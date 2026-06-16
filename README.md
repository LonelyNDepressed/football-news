# TBH Strategist

A companion / optimization dashboard for the idle game **TBH: Task Bar Hero**. Enter your progress
manually and the app computes the fastest path to advance: a single Next Best Action, per-hero stat
builds with live DPS scores, farming guidance (XP vs gold + armor survival breakpoints), rune
unlock priority, gear comparison, and an item-acquisition guide.

Built with **Vite + React + Tailwind**. Every recommendation shows its reasoning — it's a
strategist, not a black box.

- **Offline-capable PWA** — installable to home screen / desktop, works with no connection after the
  first visit (ideal for an idle-game companion).
- **Share / Import / Export** — copy a build to a link or JSON and swap it on Reddit/Discord or
  between devices. Everything stays client-side (the build code lives in the URL hash).
- **Tested math** — the damage, armor, offline, rune-queue, comp, and sharing logic is covered by a
  Vitest suite so the advice is provably correct.
- **Host-agnostic build** — relative asset paths work from a domain root, GitHub Pages subpath,
  Netlify, or Vercel with no config.

## Run it

```bash
npm install
npm run dev      # start the dev server (Vite prints the local URL)
npm run build    # production build into dist/
npm run preview  # preview the production build
npm test         # run the Vitest suite
```

## Deploy

A GitHub Actions workflow (`.github/workflows/deploy.yml`) builds, tests, and deploys to **GitHub
Pages** on every push to `main`. To go live: enable Pages (Settings → Pages → Source: GitHub
Actions). The relative base path means it also drops straight onto Netlify/Vercel/any static host —
just point them at `npm run build` and the `dist/` folder.

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
2. **Team Optimizer** — picks the single strongest party from the heroes you own and your unlocked
   slots, ranks every alternative comp, and tells you the highest-value hero to chase next.
3. **Per-Hero Builds** — formation, role-based stat priority, recommended skills, and a live DPS
   score per owned hero. Uses `DPS = AttackSpeed × AttackDamage × (1 + CritChance × (CritDamage − 1))`.
4. **Farming Advisor** — XP-vs-gold focus call, armor survival threshold (`14×stage + 12`) with
   50%/75% breakpoints, and offline-reward math (8h cap, +10% per Offline rune).
5. **Rune Advisor** — buy-next, a 6-deep priority queue, affordability, and how far your gold
   stretches down the list.
6. **Gear Compare** — score two items by weighted combat value (DPS slots weight offense highest)
   and declare a winner.
7. **Item Guide** — chest-drop routes and the Cube's 8 operations, plus the rarity ladder.

## Project structure

```
src/
  data/gameData.js          # heroes, abilities, runes, slots, cube ops, constants
  lib/calculations.js       # pure game math (DPS, armor, offline, rune queue, formatting)
  lib/strategy.js           # Next Best Action decision tree
  lib/comp.js               # team composition optimizer
  lib/share.js              # encode/decode builds for share links & import/export
  lib/*.test.js             # Vitest coverage for all of the above
  hooks/usePlayerState.js   # localStorage-backed player state (+ URL-load, import)
  components/               # TopBar, Footer, ShareBar, ErrorBoundary, UI primitives
  components/tabs/          # one file per tab
public/
  manifest.webmanifest, sw.js, icon.svg, robots.txt, sitemap.xml   # PWA + SEO
```

> Game data is fan-datamined and may shift with patches. Back up your `.es3` save before anything
> experimental. Rune costs marked "approx" are community estimates — verify in-game.
