import type { CSSProperties } from 'react'

// Ein noch nicht als „verstanden" markierter Eintrag. Granularität bestimmt die
// App (Mathe: pro Teilaufgabe, andere: pro Aufgabe) – hier nur generisch gelistet.
export interface OffenItem {
  /** Stabiler Schlüssel (= Done-Tracking-Key der App). */
  key: string
  blattId: string
  /** Überschrift der Blatt-Gruppe, z. B. „Blatt 3 — Mengen". */
  blattLabel: string
  /** Sprungziel (entspricht dem data-aufgabe-Attribut der Aufgaben-Karte). */
  aufgabeNr: string
  /** Zeilen-Text, z. B. „Aufgabe 3 (a)" oder „Aufgabe 3". */
  label: string
}

const groupStyle: CSSProperties = { marginBottom: '1rem' }
const titleStyle: CSSProperties = { margin: '0 0 0.6rem', fontSize: '1rem' }
const ulStyle: CSSProperties = { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }
const liStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
  flexWrap: 'wrap',
  padding: '0.5rem 0.7rem',
  border: '1px solid var(--border, rgba(128,128,128,0.3))',
  borderRadius: 8,
}
const labelStyle: CSSProperties = { fontSize: '0.92rem' }
const goStyle: CSSProperties = {
  flexShrink: 0,
  fontSize: '0.82rem',
  fontWeight: 600,
  padding: '0.25rem 0.7rem',
  borderRadius: 999,
  border: '1px solid var(--blue, #2563eb)',
  background: 'transparent',
  color: 'var(--blue, #2563eb)',
  cursor: 'pointer',
}
const emptyStyle: CSSProperties = { textAlign: 'center', padding: '1.5rem 1rem' }

// Liste aller noch offenen (nicht verstandenen) Einträge, nach Blatt gruppiert.
// Jeder Eintrag hat einen Link, der über `onGo` zum Blatt + zur Aufgabe zurückführt.
export function OffeneAufgaben({
  items,
  onGo,
}: {
  items: OffenItem[]
  onGo: (blattId: string, aufgabeNr: string) => void
}) {
  if (items.length === 0) {
    return (
      <div className="card" style={emptyStyle}>
        🎉 Alles als verstanden markiert! Sobald du eine Aufgabe wieder „offen" lässt, taucht sie hier auf.
      </div>
    )
  }

  const groups: { blattId: string; blattLabel: string; items: OffenItem[] }[] = []
  const byBlatt = new Map<string, { blattId: string; blattLabel: string; items: OffenItem[] }>()
  for (const it of items) {
    let g = byBlatt.get(it.blattId)
    if (!g) {
      g = { blattId: it.blattId, blattLabel: it.blattLabel, items: [] }
      byBlatt.set(it.blattId, g)
      groups.push(g)
    }
    g.items.push(it)
  }

  return (
    <div>
      {groups.map(g => (
        <div key={g.blattId} className="card" style={groupStyle}>
          <h3 style={titleStyle}>{g.blattLabel}</h3>
          <ul style={ulStyle}>
            {g.items.map(it => (
              <li key={it.key} style={liStyle}>
                <span style={labelStyle}>{it.label}</span>
                <button type="button" style={goStyle} onClick={() => onGo(it.blattId, it.aufgabeNr)}>
                  → zur Aufgabe
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
