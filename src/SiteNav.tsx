import type { CSSProperties } from 'react'
import { LERNSEITEN } from './siteList'

const navStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.4rem',
  alignItems: 'center',
}
const linkStyle: CSSProperties = {
  fontSize: '0.8rem',
  padding: '0.25rem 0.6rem',
  borderRadius: 999,
  border: '1px solid var(--border, rgba(128,128,128,0.3))',
  color: 'var(--text, inherit)',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  background: 'var(--bg2, transparent)',
}
const currentStyle: CSSProperties = {
  background: 'var(--blue-dim, rgba(77,159,255,0.15))',
  color: 'var(--blue, #4d9fff)',
  borderColor: 'transparent',
  fontWeight: 600,
}

// Querverlinkung zu den anderen Lernseiten – öffnet das Ziel in einem neuen Tab.
// `current` = key der aktuellen Seite (wird hervorgehoben statt verlinkt).
export function SiteNav({ current }: { current?: string }) {
  return (
    <nav className="site-nav" aria-label="Andere Lernseiten" style={navStyle}>
      {LERNSEITEN.map(s =>
        s.key === current ? (
          <span key={s.key} style={{ ...linkStyle, ...currentStyle }} aria-current="page">
            {s.label}
          </span>
        ) : (
          <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer" style={linkStyle}>
            {s.label}
          </a>
        ),
      )}
    </nav>
  )
}
