import { useState, useEffect, useCallback } from 'react'

// Merkt sich pro Lernseite (über document.title getrennt, wie useQuizProgress),
// welche Fragen zuletzt falsch beantwortet wurden – als Set von Frage-Texten
// (die als stabile ID dienen). Richtige Antwort entfernt die Frage wieder.
const KEY = `quiz-wrong:${(typeof document !== 'undefined' && document.title) || 'default'}`

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

export function useWrongTracker() {
  const [wrongIds, setWrongIds] = useState<Set<string>>(read)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify([...wrongIds]))
    } catch {
      /* Speicher voll/blockiert – ignorieren */
    }
  }, [wrongIds])

  const markAnswer = useCallback((id: string, correct: boolean) => {
    setWrongIds(prev => {
      if (correct ? !prev.has(id) : prev.has(id)) return prev // keine Änderung
      const next = new Set(prev)
      if (correct) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return { wrongIds, markAnswer }
}
