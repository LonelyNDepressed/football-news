export default function Footer() {
  return (
    <footer className="mt-10 border-t border-navy-800 bg-navy-950/60">
      <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-slate-500">
        <p className="mb-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-amber-200/80">
          ⚠️ <span className="font-semibold">Back up your save before anything experimental.</span>{' '}
          The save file{' '}
          <code className="rounded bg-navy-850 px-1 text-amber-100/90">
            %USERPROFILE%\AppData\LocalLow\TesseractStudio\TaskbarHero\SaveFile_Live.es3
          </code>{' '}
          is an Easy Save 3 encrypted Unity file — this tool never reads or writes it. All input is
          manual.
        </p>
        <p>
          TBH Strategist is a fan-made strategy advisor — it only computes recommendations from the
          numbers you enter. It is not affiliated with Tesseract Studio and is not a cheat or
          memory-injector. Game data is community-datamined and may shift with patches; verify costs
          and breakpoints in-game.
        </p>
      </div>
    </footer>
  )
}
