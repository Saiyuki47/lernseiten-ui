import { useEffect, useRef } from 'react'

// Ruft onPick(index) bei Druck der Zifferntasten 1..count auf (1-basiert → 0-basiert),
// solange `active`. Tippen in Eingabefeldern wird ignoriert.
export function useNumberKeys(count: number, onPick: (index: number) => void, active: boolean) {
  const cb = useRef(onPick)
  // „Latest ref": den aktuellen Callback nach dem Commit (nicht während des
  // Renders) festhalten, damit der Keydown-Handler immer die frische Version liest.
  useEffect(() => { cb.current = onPick })
  useEffect(() => {
    if (!active) return
    const handler = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return
      const n = Number(e.key)
      if (Number.isInteger(n) && n >= 1 && n <= count) {
        e.preventDefault()
        cb.current(n - 1)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [count, active])
}

// Ruft onEnter() bei Enter auf, solange `active` (Eingabefelder ausgenommen).
export function useEnterKey(onEnter: () => void, active: boolean) {
  const cb = useRef(onEnter)
  // „Latest ref" (siehe useNumberKeys): Callback nach dem Commit aktualisieren.
  useEffect(() => { cb.current = onEnter })
  useEffect(() => {
    if (!active) return
    const handler = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return
      if (e.key === 'Enter') {
        e.preventDefault()
        cb.current()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [active])
}
