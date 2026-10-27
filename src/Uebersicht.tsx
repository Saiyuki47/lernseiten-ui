import { useEffect, useMemo, useRef } from 'react'
import { marked } from 'marked'

// Übersichts-Tab (Standard-Tab jeder Lernseite): zeigt die selbst geschriebene
// `Übersicht.md` aus dem Hauptordner des Repos – wie die Seite funktioniert und
// woher die Inhalte kommen. Die App lädt die Datei per Vite-Raw-Import und
// reicht den Text durch:
//
//   import uebersicht from '../Übersicht.md?raw'
//   <Uebersicht markdown={uebersicht} />
//
// Gerendert wird GitHub-Markdown via `marked`. Links auf `#<tab>` wechseln den
// Tab (useHashTab hört auf hashchange); externe Links öffnen in einem neuen Tab.
export function Uebersicht({ markdown }: { markdown: string }) {
  const html = useMemo(() => marked.parse(markdown, { async: false, gfm: true }), [markdown])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    for (const a of ref.current?.querySelectorAll<HTMLAnchorElement>('a[href^="http"]') ?? []) {
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
    }
  }, [html])

  return (
    <div className="card uebersicht">
      {/* react-doctor-disable-next-line react-doctor/dangerous-html-sink, react-doctor/no-danger -- eigene Übersicht.md des Repos, via marked() gerendert */}
      <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
