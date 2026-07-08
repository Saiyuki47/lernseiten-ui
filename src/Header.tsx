import type { ReactNode } from 'react'
import { SiteNav } from './SiteNav'
import { useZoom, ZOOM_LEVELS, type ZoomLevel } from './useZoom'

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
  const { zoom, setZoom } = useZoom()
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
      <select
        className="zoom-select"
        value={zoom}
        onChange={e => setZoom(Number(e.target.value) as ZoomLevel)}
        aria-label="Seitenzoom"
        title="Seitengröße (Zoom)"
      >
        {ZOOM_LEVELS.map(level => (
          <option key={level} value={level}>
            {level} %
          </option>
        ))}
      </select>
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
