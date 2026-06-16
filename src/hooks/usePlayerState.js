import { useEffect, useState, useCallback } from 'react'
import { readStateFromUrl, clearUrlState } from '../lib/share.js'

const STORAGE_KEY = 'tbh-strategist-state-v1'

export const DEFAULT_STATE = {
  gold: 0,
  heroLevel: 1,
  actId: 'act1',
  difficulty: 'Normal',
  stageLevel: 1,
  slotsUnlocked: 1,
  ownedHeroes: [], // array of hero ids
  // heroStats[heroId] = { AttackDamage, AttackSpeed, CritChance, CritDamage, MaxHP, Armor }
  heroStats: {},
  ownedRunes: [], // array of rune ids
}

function load() {
  // A build code in the URL hash wins over saved state (someone followed a share link).
  const fromUrl = readStateFromUrl()
  if (fromUrl) {
    clearUrlState()
    return fromUrl
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_STATE, ...parsed, heroStats: { ...parsed.heroStats } }
  } catch {
    return DEFAULT_STATE
  }
}

/**
 * Single source of truth for all player input, persisted to localStorage so
 * progress survives reloads. Returns the state plus targeted updaters.
 */
export function usePlayerState() {
  const [state, setState] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage full / disabled — non-fatal, recommendations still work in-memory */
    }
  }, [state])

  const update = useCallback((patch) => {
    setState((prev) => ({ ...prev, ...patch }))
  }, [])

  const toggleHero = useCallback((heroId) => {
    setState((prev) => {
      const owned = prev.ownedHeroes.includes(heroId)
      const ownedHeroes = owned
        ? prev.ownedHeroes.filter((id) => id !== heroId)
        : [...prev.ownedHeroes, heroId]
      // seed empty stats for newly added hero
      const heroStats = { ...prev.heroStats }
      if (!owned && !heroStats[heroId]) {
        heroStats[heroId] = {
          AttackDamage: '',
          AttackSpeed: '',
          CritChance: '',
          CritDamage: '',
          MaxHP: '',
          Armor: '',
        }
      }
      return { ...prev, ownedHeroes, heroStats }
    })
  }, [])

  const setHeroStat = useCallback((heroId, stat, value) => {
    setState((prev) => ({
      ...prev,
      heroStats: {
        ...prev.heroStats,
        [heroId]: { ...prev.heroStats[heroId], [stat]: value },
      },
    }))
  }, [])

  const toggleRune = useCallback((runeId) => {
    setState((prev) => {
      const owned = prev.ownedRunes.includes(runeId)
      return {
        ...prev,
        ownedRunes: owned
          ? prev.ownedRunes.filter((id) => id !== runeId)
          : [...prev.ownedRunes, runeId],
      }
    })
  }, [])

  const reset = useCallback(() => {
    setState(DEFAULT_STATE)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  // Replace the whole state (used by Import / share-link loading).
  const importState = useCallback((next) => {
    setState({ ...DEFAULT_STATE, ...next, heroStats: { ...(next.heroStats || {}) } })
  }, [])

  return { state, update, toggleHero, setHeroStat, toggleRune, reset, importState }
}
