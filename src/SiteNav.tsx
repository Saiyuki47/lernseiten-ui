import { useEffect, useRef, useState } from 'react'
import { LERNSEITEN } from './siteList'

// Fächer-Navigation als Dropdown: ein Button „Lernfächer ▾" öffnet ein Menü mit
// allen Lernseiten. Navigation erfolgt im SELBEN Tab (gleicher Origin → fühlt
// sich wie eine App an, Fortschritt bleibt erhalten). `current` = aktuelle Seite
// (wird markiert, nicht verlinkt). CSS wird selbst injiziert (site-nav-*).
export function SiteNav({ current }: { current?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    injectCss()
  }, [])

  // Klick außerhalb oder Escape schließt das Menü.
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="site-nav" ref={ref}>
      <button
        type="button"
        className="site-nav-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <span aria-hidden="true">📚</span>
        Lernfächer
        <span className={`site-nav-caret${open ? ' open' : ''}`} aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="site-nav-menu" role="menu">
          {LERNSEITEN.map(s =>
            s.key === current ? (
              <span key={s.key} className="site-nav-item current" role="menuitem" aria-current="page">
                <span>{s.label}</span>
                <span className="site-nav-check" aria-hidden="true">✓</span>
              </span>
            ) : (
              <a
                key={s.key}
                href={s.url}
                role="menuitem"
                className="site-nav-item"
                onClick={() => setOpen(false)}
              >
                <span>{s.label}</span>
              </a>
            ),
          )}
        </div>
      )}
    </div>
  )
}

const SITE_NAV_CSS = `
.site-nav{position:relative;display:inline-block}
.site-nav-btn{display:inline-flex;align-items:center;gap:.4rem;font-size:.82rem;font-weight:500;padding:.3rem .7rem;border-radius:999px;border:1px solid var(--border,rgba(128,128,128,.3));background:var(--bg2,transparent);color:var(--text,inherit);cursor:pointer;line-height:1.3}
.site-nav-btn:hover{border-color:var(--blue,#4d9fff);color:var(--blue,#4d9fff)}
.site-nav-caret{font-size:.7rem;transition:transform .15s}
.site-nav-caret.open{transform:rotate(180deg)}
.site-nav-menu{position:absolute;top:calc(100% + .4rem);left:0;z-index:60;min-width:230px;display:flex;flex-direction:column;gap:.1rem;padding:.35rem;border-radius:10px;border:1px solid var(--border,rgba(128,128,128,.25));background:var(--bg2,#1b1f24);box-shadow:0 10px 30px rgba(0,0,0,.35)}
.site-nav-item{display:flex;align-items:center;justify-content:space-between;gap:.8rem;padding:.45rem .6rem;border-radius:7px;font-size:.85rem;color:var(--text,inherit);text-decoration:none}
a.site-nav-item:hover{background:var(--bg3,rgba(128,128,128,.14))}
.site-nav-item.current{color:var(--blue,#4d9fff);font-weight:600;cursor:default}
.site-nav-check{color:var(--blue,#4d9fff)}
`

function injectCss() {
  if (typeof document === 'undefined') return
  if (document.getElementById('lernseiten-sitenav-css')) return
  const s = document.createElement('style')
  s.id = 'lernseiten-sitenav-css'
  s.textContent = SITE_NAV_CSS
  document.head.appendChild(s)
}
