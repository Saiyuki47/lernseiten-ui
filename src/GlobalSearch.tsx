import {
  useState,
  useEffect,
  useRef,
  useMemo,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'

// Ein durchsuchbarer Eintrag – wird pro Lernseite aus deren Inhalten gebaut.
export interface SearchItem {
  label: string
  snippet?: string
  tab: string // Ziel-Tab (an onNavigate übergeben)
  keywords?: string
}

const backdrop: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingTop: '10vh',
  zIndex: 1000,
}
const panel: CSSProperties = {
  width: 'min(560px, 92vw)',
  background: 'var(--bg2, #1e1e1e)',
  color: 'var(--text, #eee)',
  border: '1px solid var(--border, rgba(128,128,128,0.3))',
  borderRadius: 12,
  padding: 12,
  boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
}
const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '1rem',
  borderRadius: 8,
  border: '1px solid var(--border, rgba(128,128,128,0.3))',
  background: 'var(--bg, #111)',
  color: 'var(--text, #eee)',
  outline: 'none',
  boxSizing: 'border-box',
}
const tabBadge: CSSProperties = {
  display: 'inline-block',
  marginTop: 4,
  fontSize: '0.7em',
  opacity: 0.6,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}
const resultStyle = (active: boolean): CSSProperties => ({
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '8px 10px',
  borderRadius: 8,
  border: 'none',
  background: active ? 'var(--blue-dim, rgba(77,159,255,0.15))' : 'transparent',
  color: 'var(--text, #eee)',
  cursor: 'pointer',
  marginBottom: 2,
})

// ---------------------------------------------------------------------------
// Globale Suche: Trigger-Button + Overlay. Öffnet per Klick oder Strg/Cmd-K,
// Pfeiltasten wählen, Enter springt zum Treffer-Tab, Esc schließt.
// ---------------------------------------------------------------------------
export function GlobalSearch({
  index,
  onNavigate,
}: {
  index: SearchItem[]
  onNavigate: (tab: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSel(0)
      const id = window.setTimeout(() => inputRef.current?.focus(), 0)
      return () => window.clearTimeout(id)
    }
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return index.slice(0, 8)
    const terms = q.split(/\s+/)
    return index
      .map(it => {
        const hay = `${it.label} ${it.snippet ?? ''} ${it.keywords ?? ''} ${it.tab}`.toLowerCase()
        const score = terms.every(t => hay.includes(t))
          ? terms.reduce((s, t) => s + (it.label.toLowerCase().includes(t) ? 2 : 1), 0)
          : 0
        return { it, score }
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map(r => r.it)
  }, [query, index])

  const go = (it: SearchItem) => {
    onNavigate(it.tab)
    setOpen(false)
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') setOpen(false)
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSel(s => Math.min(s + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSel(s => Math.max(s - 1, 0))
    } else if (e.key === 'Enter') {
      const r = results[sel]
      if (r) go(r)
    }
  }

  return (
    <>
      <button type="button" className="filter-btn" onClick={() => setOpen(true)} aria-label="Suche öffnen">
        🔍 Suche
      </button>
      {open && (
        <div style={backdrop} onClick={() => setOpen(false)} role="presentation">
          <div style={panel} onClick={e => e.stopPropagation()} role="presentation">
            <input
              ref={inputRef}
              style={inputStyle}
              placeholder="Suchen… (Thema, Aufgabe, Formel)"
              value={query}
              onChange={e => {
                setQuery(e.target.value)
                setSel(0)
              }}
              onKeyDown={onKeyDown}
            />
            <div style={{ maxHeight: '50vh', overflowY: 'auto', marginTop: 8 }}>
              {results.length === 0 ? (
                <p style={{ opacity: 0.6, padding: 8 }}>Keine Treffer.</p>
              ) : (
                results.map((it, i) => (
                  <button
                    type="button"
                    key={`${it.tab}|${it.label}|${it.snippet ?? ''}`}
                    onClick={() => go(it)}
                    onMouseEnter={() => setSel(i)}
                    style={resultStyle(i === sel)}
                  >
                    <span style={{ fontWeight: 600 }}>{it.label}</span>
                    {it.snippet && (
                      <span style={{ opacity: 0.7, display: 'block', fontSize: '0.85em' }}>{it.snippet}</span>
                    )}
                    <span style={tabBadge}>{it.tab}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
