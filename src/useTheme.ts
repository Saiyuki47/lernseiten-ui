import { useEffect, useRef, useState } from 'react'

type Theme = 'dark' | 'light'

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function getStoredTheme(): Theme | null {
  return localStorage.getItem('theme') as Theme | null
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme() ?? getSystemTheme())
  // Whether the user has an explicit, persisted theme. Read once on mount; the
  // persist effect below keeps it true afterwards (matches previous behaviour).
  const hasStoredPreference = useRef<boolean | undefined>(undefined)
  if (hasStoredPreference.current === undefined) {
    hasStoredPreference.current = getStoredTheme() !== null
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
    hasStoredPreference.current = true
  }, [theme])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const handler = () => {
      if (!hasStoredPreference.current) setTheme(getSystemTheme())
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggle }
}
