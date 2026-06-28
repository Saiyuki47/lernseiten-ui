import type { ReactNode } from 'react'
import { SiteNav } from './SiteNav'

interface Props {
  /** Logo-Inhalt (z.B. <>Algebraische<span>.</span>Grundlagen</>). */
  logo: ReactNode
  /** Untertitel-Zeile. */
  subtitle: ReactNode
  /** Key der aktuellen Lernseite (für die Fächer-Navigation). */
  current?: string
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}

// Geteilter Kopfbereich aller Lernseiten: Logo + Untertitel + Fächer-Navigation
// (SiteNav) und der Hell/Dunkel-Umschalter. Nutzt die App-CSS-Klassen
// (header/.logo/.subtitle/.theme-toggle), die in der gemeinsamen Basis liegen.
export function Header({ logo, subtitle, current, theme, onToggleTheme }: Props) {
  return (
    <header>
      <div>
        <div className="logo">{logo}</div>
        <div className="subtitle">{subtitle}</div>
        <SiteNav current={current} />
      </div>
      <button
        type="button"
        className="theme-toggle"
        onClick={onToggleTheme}
        aria-label={theme === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
        title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </header>
  )
}
