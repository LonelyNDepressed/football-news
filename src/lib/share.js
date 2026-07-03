// Encode/decode player state to a compact, URL-safe string so players can share
// a build via link or paste, and re-import it. Uses base64url over JSON.

import { DEFAULT_STATE } from '../hooks/usePlayerState.js'

function toBase64Url(str) {
  // Unicode-safe base64, then make it URL-safe.
  const b64 = btoa(unescape(encodeURIComponent(str)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : ''
  return decodeURIComponent(escape(atob(b64 + pad)))
}

/** Whitelist only known fields so a pasted blob can't inject junk into state. */
function sanitize(raw) {
  const out = { ...DEFAULT_STATE }
  if (!raw || typeof raw !== 'object') return out
  for (const key of Object.keys(DEFAULT_STATE)) {
    if (raw[key] !== undefined) out[key] = raw[key]
  }
  // Defensive shape checks.
  if (!Array.isArray(out.ownedHeroes)) out.ownedHeroes = []
  if (!Array.isArray(out.ownedRunes)) out.ownedRunes = []
  if (typeof out.heroStats !== 'object' || out.heroStats == null) out.heroStats = {}
  return out
}

export function encodeState(state) {
  try {
    return toBase64Url(JSON.stringify(sanitize(state)))
  } catch {
    return ''
  }
}

export function decodeState(code) {
  try {
    return sanitize(JSON.parse(fromBase64Url(code)))
  } catch {
    return null
  }
}

/** Build a shareable absolute URL (state lives in the hash, never sent to a server). */
export function buildShareUrl(state) {
  const code = encodeState(state)
  const base = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''
  return `${base}#b=${code}`
}

/** Read an incoming build code from the current URL hash, if present. */
export function readStateFromUrl() {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash || ''
  const m = hash.match(/[#&]b=([^&]+)/)
  if (!m) return null
  return decodeState(m[1])
}

/** Remove the build code from the URL bar without reloading. */
export function clearUrlState() {
  if (typeof window === 'undefined') return
  if (window.location.hash.includes('b=')) {
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }
}

export const exportJson = (state) => JSON.stringify(sanitize(state), null, 2)
export const importJson = (text) => {
  try {
    return sanitize(JSON.parse(text))
  } catch {
    return null
  }
}
