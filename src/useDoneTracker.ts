import { useState, useEffect, useCallback } from 'react'

// Merkt sich pro Lernseite (über document.title getrennt), welche Einträge als
// "verstanden/erledigt" markiert wurden – z.B. Aufgaben pro Übungsblatt.
// IDs sind frei wählbare Strings (z.B. `${blattId}-${aufgabeNr}`).
const KEY = `done:${(typeof document !== 'undefined' && document.title) || 'default'}`

function read(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const a = JSON.parse(raw)
      if (Array.isArray(a)) return new Set(a.filter((x): x is string => typeof x === 'string'))
    }
  } catch {
    /* ungültige Daten ignorieren */
  }
  return new Set()
}

export function useDoneTracker() {
  const [done, setDone] = useState<Set<string>>(read)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify([...done]))
    } catch {
      /* ignorieren */
    }
  }, [done])

  const toggle = useCallback((id: string) => {
    setDone(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Anteil erledigter IDs aus einer Liste (0..1) – praktisch für Fortschrittsbalken.
  const ratio = useCallback(
    (ids: string[]) => (ids.length === 0 ? 0 : ids.reduce((n, id) => (done.has(id) ? n + 1 : n), 0) / ids.length),
    [done],
  )

  return { done, toggle, ratio }
}
