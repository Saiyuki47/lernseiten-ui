import { useState, useEffect, useCallback, useRef } from 'react'

// Hält einen Tab-Zustand mit dem URL-Hash synchron: teilbar und übersteht den
// Reload. `allowed` = erlaubte Werte (unbekannte Hashes fallen auf `fallback`).
//
//   const [tab, setTab] = useHashTab(['uebung','quiz'] as const, 'uebung')
export function useHashTab<T extends string>(allowed: readonly T[], fallback: T): [T, (v: T) => void] {
  const cfg = useRef({ allowed, fallback })
  cfg.current = { allowed, fallback }

  const parse = (): T => {
    const h = decodeURIComponent(window.location.hash.replace(/^#/, '')) as T
    return cfg.current.allowed.includes(h) ? h : cfg.current.fallback
  }

  const [value, setValue] = useState<T>(parse)

  useEffect(() => {
    const onHash = () => {
      const h = decodeURIComponent(window.location.hash.replace(/^#/, '')) as T
      setValue(cfg.current.allowed.includes(h) ? h : cfg.current.fallback)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const set = useCallback((v: T) => {
    if (window.location.hash.replace(/^#/, '') !== v) window.location.hash = v
    setValue(v)
  }, [])

  return [value, set]
}
