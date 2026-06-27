import { useState, useEffect, useCallback } from 'react'

// Quiz-Fortschritt lokal speichern (localStorage, bewusst keine Cookies).
//
// HYBRID-Modell, weil alle Lernseiten als GitHub-Pages-Projektseiten denselben
// Origin teilen (z.B. https://<user>.github.io):
//   - Tages-Streak  -> GLOBAL über alle Seiten (geteilter Schlüssel)
//   - heute/gestern -> PRO SEITE getrennt (Schlüssel je Seitentitel)
// So zählt der Streak "an wie vielen Tagen am Stück hast du irgendwo gelernt",
// während die Tageszähler fachspezifisch bleiben. Der Seitentitel (document.title)
// trennt die Zähler automatisch – beim Portieren ist nichts anzupassen.

export interface QuizStats {
  /** Tages-Streak – global über alle Lernseiten. */
  streak: number
  /** Heute richtig – nur diese Seite. */
  today: number
  /** Gestern richtig – nur diese Seite. */
  yesterday: number
}

const STREAK_KEY = 'quiz-streak'
const COUNTS_KEY = `quiz-counts:${(typeof document !== 'undefined' && document.title) || 'default'}`

interface StreakStore {
  /** Letzter Tag mit richtiger Antwort auf IRGENDEINER Seite (YYYY-MM-DD). */
  lastActive: string
  streak: number
}
interface CountsStore {
  /** Letzter Tag mit richtiger Antwort auf DIESER Seite (YYYY-MM-DD). */
  lastActive: string
  todayCount: number
  prevCount: number
}

const EMPTY_STREAK: StreakStore = { lastActive: '', streak: 0 }
const EMPTY_COUNTS: CountsStore = { lastActive: '', todayCount: 0, prevCount: 0 }

function todayStr(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Ganze Tage zwischen zwei YYYY-MM-DD-Daten (über UTC, damit die Zeitzone wegfällt).
function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000)
}

function readStreak(): StreakStore {
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (p && typeof p.lastActive === 'string') {
        return { lastActive: p.lastActive, streak: Number(p.streak) || 0 }
      }
    }
  } catch {
    /* ungültige Daten ignorieren */
  }
  return { ...EMPTY_STREAK }
}

function readCounts(): CountsStore {
  try {
    const raw = localStorage.getItem(COUNTS_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (p && typeof p.lastActive === 'string') {
        return { lastActive: p.lastActive, todayCount: Number(p.todayCount) || 0, prevCount: Number(p.prevCount) || 0 }
      }
    }
  } catch {
    /* ungültige Daten ignorieren */
  }
  return { ...EMPTY_COUNTS }
}

// Anzeige-Streak: lebt, solange heute oder gestern aktiv; bei Lücke 0.
function streakFor(s: StreakStore, today: string): number {
  if (!s.lastActive) return 0
  return daysBetween(s.lastActive, today) <= 1 ? s.streak : 0
}

// Anzeige-Zähler dieser Seite für heute/gestern.
function countsFor(c: CountsStore, today: string): { today: number; yesterday: number } {
  if (!c.lastActive) return { today: 0, yesterday: 0 }
  const d = daysBetween(c.lastActive, today)
  if (d <= 0) return { today: c.todayCount, yesterday: c.prevCount }
  if (d === 1) return { today: 0, yesterday: c.todayCount }
  return { today: 0, yesterday: 0 }
}

// Reine Übergänge nach einer richtigen Antwort.
function advanceStreak(prev: StreakStore): StreakStore {
  const t = todayStr()
  const d = prev.lastActive ? daysBetween(prev.lastActive, t) : Infinity
  if (d <= 0) return prev // heute schon gezählt
  if (d === 1) return { lastActive: t, streak: prev.streak + 1 }
  return { lastActive: t, streak: 1 }
}
function advanceCounts(prev: CountsStore): CountsStore {
  const t = todayStr()
  const d = prev.lastActive ? daysBetween(prev.lastActive, t) : Infinity
  if (d <= 0) return { ...prev, lastActive: t, todayCount: prev.todayCount + 1 }
  if (d === 1) return { lastActive: t, todayCount: 1, prevCount: prev.todayCount }
  return { lastActive: t, todayCount: 1, prevCount: 0 }
}

export function useQuizProgress() {
  const [streakStore, setStreakStore] = useState<StreakStore>(readStreak)
  const [countsStore, setCountsStore] = useState<CountsStore>(readCounts)

  useEffect(() => {
    try {
      localStorage.setItem(STREAK_KEY, JSON.stringify(streakStore))
    } catch {
      /* Speicher voll/blockiert – ignorieren */
    }
  }, [streakStore])
  useEffect(() => {
    try {
      localStorage.setItem(COUNTS_KEY, JSON.stringify(countsStore))
    } catch {
      /* Speicher voll/blockiert – ignorieren */
    }
  }, [countsStore])

  const recordCorrect = useCallback(() => {
    setStreakStore(advanceStreak)
    setCountsStore(advanceCounts)
  }, [])

  const today = todayStr()
  const counts = countsFor(countsStore, today)
  return { streak: streakFor(streakStore, today), today: counts.today, yesterday: counts.yesterday, recordCorrect }
}
