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
  // Klick auf den Titel führt zur sauberen URL zurück (Pfad ohne #-Hash) —
  // die Seite lädt im Startzustand, Deep-Link-Reste wie #uebung/blatt0/1
  // verschwinden. Echter Link, damit auch Mittelklick/Neuer-Tab funktioniert.
  const cleanHref =
    typeof window === 'undefined' ? '.' : window.location.pathname + window.location.search
  return (
    <header>
      <div>
        <a className="logo" href={cleanHref} title="Zur Startansicht">
          {logo}
        </a>
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
