import { useState } from 'react'
import { buildShareUrl, exportJson, importJson } from '../lib/share.js'

// Share / export / import controls. Lets players swap builds on Reddit, Discord,
// or between devices. All client-side — the build code lives in the URL hash and
// is never sent to a server.
export default function ShareBar({ state, onImport }) {
  const [status, setStatus] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')

  const flash = (msg) => {
    setStatus(msg)
    setTimeout(() => setStatus(''), 2200)
  }

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      flash(`${label} copied ✓`)
    } catch {
      // Fallback for clipboard-blocked contexts.
      window.prompt(`Copy ${label}:`, text)
    }
  }

  const handleImport = () => {
    const parsed = importJson(importText)
    if (!parsed) {
      flash('Could not read that build ✗')
      return
    }
    onImport(parsed)
    setShowImport(false)
    setImportText('')
    flash('Build imported ✓')
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => copy(buildShareUrl(state), 'Share link')}
        className="rounded-lg border border-navy-700 bg-navy-850 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-gold-600/60 hover:text-gold-300"
        title="Copy a link that loads this exact build"
      >
        🔗 Share link
      </button>
      <button
        onClick={() => copy(exportJson(state), 'Build JSON')}
        className="rounded-lg border border-navy-700 bg-navy-850 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-gold-600/60 hover:text-gold-300"
        title="Copy this build as JSON"
      >
        ⬇️ Export
      </button>
      <button
        onClick={() => setShowImport((s) => !s)}
        className="rounded-lg border border-navy-700 bg-navy-850 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-gold-600/60 hover:text-gold-300"
        title="Paste a build JSON to load it"
      >
        ⬆️ Import
      </button>
      {status && <span className="text-xs text-emerald-300">{status}</span>}

      {showImport && (
        <div className="w-full">
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste a build JSON here…"
            rows={4}
            className="field-input mt-2 w-full font-mono text-xs"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleImport}
              className="rounded-lg border border-gold-600/60 bg-gold-500/10 px-3 py-1.5 text-xs font-medium text-gold-300 hover:bg-gold-500/20"
            >
              Load build
            </button>
            <button
              onClick={() => {
                setShowImport(false)
                setImportText('')
              }}
              className="rounded-lg border border-navy-700 bg-navy-850 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
