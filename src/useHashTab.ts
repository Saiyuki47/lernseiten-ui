import { useState, useEffect, useCallback, useRef } from 'react'

// Hash-Format: #<tab>/<blatt>/<aufgabe>. Der Tab steht im ersten Segment,
// optionale Tief-Link-Infos (Blatt + Aufgabe) folgen dahinter.
const rawHash = () => (typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '')
function seg(i: number): string | undefined {
  const s = rawHash().split('/')[i]
  if (s == null) return undefined
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

// Hält einen Tab-Zustand mit dem URL-Hash synchron (erstes Segment): teilbar und
// übersteht den Reload. `allowed` = erlaubte Werte (unbekannte → `fallback`).
//
//   const [tab, setTab] = useHashTab(['uebung','quiz'] as const, 'uebung')
export function useHashTab<T extends string>(allowed: readonly T[], fallback: T): [T, (v: T) => void] {
  const cfg = useRef({ allowed, fallback })
  cfg.current = { allowed, fallback }

  const parse = (): T => {
    const h = (seg(0) ?? '') as T
    return cfg.current.allowed.includes(h) ? h : cfg.current.fallback
  }

  const [value, setValue] = useState<T>(parse)

  useEffect(() => {
    const onHash = () => {
      const h = (seg(0) ?? '') as T
      setValue(cfg.current.allowed.includes(h) ? h : cfg.current.fallback)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Tab-Wechsel setzt den Hash neu (verwirft Blatt/Aufgabe – sind tab-spezifisch).
  const set = useCallback((v: T) => {
    if (seg(0) !== v) window.location.hash = encodeURIComponent(v)
    setValue(v)
  }, [])

  return [value, set]
}

// Liest die Tief-Link-Teile aus dem Hash (#tab/blatt/aufgabe).
export function getHashDetail(): { tab: string; blatt?: string; aufgabe?: string } {
  return { tab: seg(0) ?? '', blatt: seg(1), aufgabe: seg(2) }
}

// Schreibt Blatt/Aufgabe in den Hash und behält den Tab (erstes Segment).
// history.replaceState → kein neuer History-Eintrag, kein hashchange-Event.
export function setHashDetail(blatt?: string, aufgabe?: string): void {
  if (typeof window === 'undefined') return
  const tab = rawHash().split('/')[0] || ''
  const parts = [tab]
  if (blatt) {
    parts.push(encodeURIComponent(blatt))
    if (aufgabe) parts.push(encodeURIComponent(aufgabe))
  }
  const next = '#' + parts.join('/')
  if (window.location.hash !== next) history.replaceState(null, '', next)
}

// Deep-Linking für Aufgabenlisten: scrollt beim Laden zur in der URL genannten
// Aufgabe und schreibt laufend die oben sichtbare Aufgabe in den Hash.
// `blattId` = aktuell gewähltes Blatt. Rückgabe: ref für den Aufgaben-Container;
// jede Aufgaben-Karte braucht das Attribut `data-aufgabe="<nr>"`.
export function useTaskDeepLink<E extends HTMLElement = HTMLDivElement>(blattId: string) {
  const ref = useRef<E>(null)

  // Nur beim ersten Mount: zur in der URL genannten Aufgabe springen.
  useEffect(() => {
    const d = getHashDetail()
    const root = ref.current
    if (!d.aufgabe || !root) return
    const el = [...root.querySelectorAll<HTMLElement>('[data-aufgabe]')].find(
      c => c.dataset.aufgabe === d.aufgabe,
    )
    if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }))
  }, [])

  // Oben sichtbare Aufgabe laufend in den Hash schreiben (Neu-Beobachtung je Blatt).
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const cards = [...root.querySelectorAll<HTMLElement>('[data-aufgabe]')]
    if (cards.length === 0) return
    let last = ''
    const update = () => {
      const top = cards.find(c => {
        const r = c.getBoundingClientRect()
        return r.bottom > 0 && r.top < window.innerHeight * 0.25
      })
      const nr = top?.dataset.aufgabe
      if (nr && nr !== last) {
        last = nr
        setHashDetail(blattId, nr)
      }
    }
    const io = new IntersectionObserver(update, { threshold: [0, 1] })
    cards.forEach(c => io.observe(c))
    return () => io.disconnect()
  }, [blattId])

  return ref
}
