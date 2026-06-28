import { Children, useEffect, useRef, useState, type ReactNode } from 'react'
import { getHashDetail, setHashDetail } from './useHashTab'

// ---------------------------------------------------------------------------
// Geteilter "Referenz"-Tab (Stil von Algebraische Grundlagen): Inhaltsverzeichnis
// links (Scroll-Spy) + erklärte Karten rechts. Jede Karte kann pro Szenario eine
// aufklappbare Beispiel-Liste haben. Deep-Link über den Hash `#<tab>/<id>` — die
// Übungsblätter verlinken mit `<a href="#referenz/<id>">` direkt auf ein Thema.
//
// Inhalt ist renderer-agnostisch: die App übergibt `render` (Block, z.B. MathText
// oder FormelText) und optional `renderInline` (für Titel). Das CSS injiziert die
// Komponente selbst (`lsref-*`), damit keine App eigene Klassen braucht.
// ---------------------------------------------------------------------------

/** Eine aufklappbare Beispielgruppe (ein Szenario, mehrere Beispiele als Text). */
export interface ReferenzBeispiel {
  szenario: string
  beispiele: string[]
}

/** Beispielgruppe mit bereits gerenderten Beispielen (FormelText/strukturierte Inhalte). */
export interface ReferenzBeispielNode {
  szenario: string
  beispiele: ReactNode[]
}

/** Eine Referenz-Karte = ein Thema, von Grund auf erklärt. */
export interface ReferenzKarte {
  /** Stabiler Slug für Inhaltsverzeichnis + Deep-Link (#<tab>/<id>). */
  id: string
  titel: string
  /** Text-Inhalt (über `render` gerendert) – ignoriert, wenn `inhaltNode` gesetzt ist. */
  inhalt?: string
  /** Fertig gerenderter Inhalt (z.B. FormelText/strukturierte Blöcke) statt `inhalt`. */
  inhaltNode?: ReactNode
  /** Optional fertig gerenderter Titel (statt `render(titel)`). */
  titelNode?: ReactNode
  /** Aufklappbare Beispiele als Text (über `render`). */
  beispiele?: ReferenzBeispiel[]
  /** Aufklappbare Beispiele als fertige Nodes. */
  beispieleNode?: ReferenzBeispielNode[]
}

interface Props {
  karten: ReferenzKarte[]
  /** Block-Renderer für Text-inhalt + Text-Beispiele (z.B. text => <MathText block>…).
   *  Optional – nur nötig, wenn Karten `inhalt`/`beispiele` als Text nutzen. */
  render?: (text: string) => ReactNode
  /** Inline-Renderer für Titel (Standard: render). */
  renderInline?: (text: string) => ReactNode
  /** Untertitel unter der Überschrift. */
  intro?: string
  /** Tab-Schlüssel für den Deep-Link-Hash (#<tab>/<id>). */
  tab?: string
}

const cardDomId = (id: string) => `lsref-card-${id}`

// Rendert Text über den App-Renderer in einer eigenen Komponente, damit React
// nach Komponententyp rekonziliert (kein Remount pro Render – no-render-in-render).
function Rendered({ fn, text }: { fn: (t: string) => ReactNode; text: string }) {
  return <>{fn(text)}</>
}

// Standard-Renderer, wenn die App keinen `render` übergibt (reiner Text).
const identity = (t: string): ReactNode => t

// Rendert den (schweren) Karten-Inhalt erst, wenn die Karte in die Nähe des
// Sichtfensters kommt (Lazy-Mount via IntersectionObserver). So blockiert beim
// Öffnen des Tabs nicht das gesamte KaTeX/Markup auf einmal – sichtbare Karten
// sind sofort da, der Rest lädt beim Scrollen nach. Einmal gerendert bleibt es.
function LazyBody({ children, eager, minHeight = 220 }: { children: ReactNode; eager?: boolean; minHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(!!eager)
  useEffect(() => {
    if (shown) return
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '800px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [shown])
  return (
    <div ref={ref} style={shown ? undefined : { minHeight }}>
      {shown ? children : null}
    </div>
  )
}

export function Referenz({
  karten,
  render,
  renderInline,
  intro = 'Jedes Thema von Grund auf erklärt – ohne Vorwissen verständlich.',
  tab = 'referenz',
}: Props) {
  const renderText = render ?? identity
  const renderTitle = renderInline ?? render ?? identity
  const [activeId, setActiveId] = useState<string>(() => karten[0]?.id ?? '')
  // Deep-Link beim ersten Laden: alle Karten BIS EINSCHLIESSLICH Ziel sofort
  // (eager) rendern, damit die Scrollposition stimmt (Karten darüber dürfen die
  // Höhe nicht mehr nachträglich verschieben). Karten unter dem Ziel bleiben lazy.
  const [initialHash] = useState(() => getHashDetail())
  const eagerTarget = initialHash.tab === tab ? initialHash.blatt : undefined
  const eagerIndex = eagerTarget ? karten.findIndex(k => k.id === eagerTarget) : -1
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    injectCss()
  }, [])

  // Scroll-Spy: hebt im Inhaltsverzeichnis das oben sichtbare Thema hervor.
  useEffect(() => {
    const onScroll = () => {
      const cards = contentRef.current?.querySelectorAll<HTMLElement>('.lsref-card')
      if (!cards || cards.length === 0) return
      const threshold = 120
      let current = cards[0].dataset.refId ?? ''
      cards.forEach(c => {
        if (c.getBoundingClientRect().top <= threshold) current = c.dataset.refId ?? current
      })
      if (current) setActiveId(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Deep-Link: beim Laden / bei Hash-Änderung zum genannten Thema scrollen.
  // KaTeX/Fonts rendern asynchron und verschieben das Layout, daher mehrfach
  // nachscrollen, bis die Karte sicher oben steht.
  useEffect(() => {
    const scrollToHash = () => {
      const d = getHashDetail()
      if (d.tab !== tab || !d.blatt) return
      const id = cardDomId(d.blatt)
      const doScroll = () => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ block: 'start' })
      }
      setActiveId(d.blatt)
      requestAnimationFrame(doScroll)
      setTimeout(doScroll, 200)
      setTimeout(doScroll, 500)
      if (typeof document !== 'undefined' && document.fonts?.ready) {
        document.fonts.ready.then(() => setTimeout(doScroll, 50))
      }
    }
    scrollToHash()
    window.addEventListener('hashchange', scrollToHash)
    return () => window.removeEventListener('hashchange', scrollToHash)
  }, [tab])

  const handleNavClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const el = document.getElementById(cardDomId(id))
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveId(id)
      setHashDetail(id, undefined, tab)
    }
  }

  return (
    <div>
      <div className="section-header">
        <h2>Referenz</h2>
        <p>{intro}</p>
      </div>
      <div className="lsref-layout">
        <nav className="lsref-nav" aria-label="Themen">
          <ul>
            {karten.map(karte => (
              <li key={karte.id}>
                <a
                  href={`#${tab}/${karte.id}`}
                  className={activeId === karte.id ? 'active' : ''}
                  onClick={e => handleNavClick(e, karte.id)}
                >
                  {karte.titelNode ?? <Rendered fn={renderTitle} text={karte.titel} />}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="lsref-content" ref={contentRef}>
          {karten.map((karte, i) => (
            <article
              key={karte.id}
              id={cardDomId(karte.id)}
              data-ref-id={karte.id}
              className="lsref-card"
            >
              <h3>{karte.titelNode ?? <Rendered fn={renderTitle} text={karte.titel} />}</h3>
              <LazyBody eager={i === 0 || (eagerIndex >= 0 && i <= eagerIndex)}>
                <div className="lsref-text">
                  {karte.inhaltNode ?? <Rendered fn={renderText} text={karte.inhalt ?? ''} />}
                </div>
                {karte.beispiele?.map(gruppe => (
                  <details className="lsref-bsp" key={gruppe.szenario}>
                    <summary>
                      Beispiele: {gruppe.szenario}{' '}
                      <span className="lsref-bsp-n">({gruppe.beispiele.length})</span>
                    </summary>
                    <ol className="lsref-bsp-list">
                      {gruppe.beispiele.map(bsp => (
                        <li key={bsp}><Rendered fn={renderText} text={bsp} /></li>
                      ))}
                    </ol>
                  </details>
                ))}
                {karte.beispieleNode?.map(gruppe => (
                  <details className="lsref-bsp" key={gruppe.szenario}>
                    <summary>
                      Beispiele: {gruppe.szenario}{' '}
                      <span className="lsref-bsp-n">({gruppe.beispiele.length})</span>
                    </summary>
                    <ol className="lsref-bsp-list">
                      {Children.toArray(gruppe.beispiele.map(bsp => <li>{bsp}</li>))}
                    </ol>
                  </details>
                ))}
              </LazyBody>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

// Theme-fähige Styles (nutzen die :root-Variablen der App, mit Fallbacks).
const REFERENZ_CSS = `
.lsref-layout{display:grid;grid-template-columns:230px minmax(0,1fr);gap:1.5rem;align-items:start}
.lsref-nav{position:sticky;top:80px;max-height:calc(100vh - 100px);overflow:auto}
.lsref-nav ul{list-style:none;margin:0;padding:0}
.lsref-nav li{margin:0}
.lsref-nav a{display:block;padding:.32rem .55rem;margin:.1rem 0;border-radius:6px;border-left:2px solid transparent;color:var(--text2,#6b7280);text-decoration:none;font-size:.85rem;line-height:1.35;cursor:pointer}
.lsref-nav a:hover{background:var(--bg2,#f3f4f6);color:var(--text,#111)}
.lsref-nav a.active{background:var(--bg2,#f3f4f6);color:var(--text,#111);border-left-color:var(--blue,#2563eb);font-weight:600}
.lsref-content{min-width:0}
.lsref-card{margin:0 0 2rem;scroll-margin-top:80px}
.lsref-card h3{margin:0 0 .6rem;font-size:1.2rem;color:var(--text,#111)}
.lsref-text{line-height:1.6;color:var(--text,#111)}
.lsref-text table{border-collapse:collapse;margin:.5rem 0}
.lsref-text th,.lsref-text td{border:1px solid var(--border2,#d1d5db);padding:.25rem .6rem;text-align:center}
.lsref-bsp{margin:.6rem 0 0;border:1px solid var(--border,#e5e7eb);border-radius:8px;background:var(--bg2,#f9fafb);overflow:hidden}
.lsref-bsp>summary{cursor:pointer;padding:.5rem .75rem;font-size:.88rem;font-weight:600;color:var(--text,#111);list-style:none}
.lsref-bsp>summary::-webkit-details-marker{display:none}
.lsref-bsp>summary::before{content:"▸";display:inline-block;margin-right:.5rem;color:var(--blue,#2563eb);transition:transform .15s}
.lsref-bsp[open]>summary::before{transform:rotate(90deg)}
.lsref-bsp-n{color:var(--text2,#6b7280);font-weight:400}
.lsref-bsp-list{margin:0;padding:.25rem 1rem .75rem 2.4rem;display:flex;flex-direction:column;gap:.6rem}
.lsref-bsp-list li{line-height:1.55}
@media(max-width:760px){.lsref-layout{grid-template-columns:1fr}.lsref-nav{position:static;max-height:none;border-bottom:1px solid var(--border,#e5e7eb);padding-bottom:.5rem;margin-bottom:.5rem}}
`

function injectCss() {
  if (typeof document === 'undefined') return
  if (document.getElementById('lernseiten-referenz-css')) return
  const s = document.createElement('style')
  s.id = 'lernseiten-referenz-css'
  s.textContent = REFERENZ_CSS
  document.head.appendChild(s)
}
