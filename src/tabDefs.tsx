import type { ReactNode } from 'react'
import type { TabDef } from './Tabs'

// Zentrale Tab-Definitionen der Lernseiten: EIN Icon + EIN Label pro
// Standard-Tab-ID, damit jeder Tab über alle Projekte identisch aussieht.
// Die Apps bauen ihre Tab-Leiste mit `tabDefs(TABS)` – lokale Tabs.tsx mit
// duplizierten SVGs entfallen. Neue Standard-Tabs hier ergänzen (und in
// siteList.ts/SITE_TABS nachtragen, damit die Tab-Mitnahme sie kennt).

const ICONS: Record<string, ReactNode> = {
  // Dokument mit Eselsohr + Zeilen
  uebung: (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  // Aufgeschlagenes Buch
  referenz: (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  // Drucker (druckbares Klausur-Hilfsblatt)
  hilfsmittel: (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  // Gestapelte Karten
  karten: (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="7" width="13" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 012-2h9a2 2 0 012 2v9a2 2 0 01-2 2h-2" />
    </svg>
  ),
  // Absolventenhut (Lernplattform)
  moodle: (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 10L12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1.5 2.7 2.5 6 2.5s6-1 6-2.5v-5" />
      <line x1="22" y1="10" x2="22" y2="15" />
    </svg>
  ),
  // Fragezeichen im Kreis
  quiz: (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
    </svg>
  ),
  // Datenbank-Zylinder (DB-Sonderfall)
  schema: (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
}

const LABELS: Record<string, string> = {
  uebung: 'Übungsblätter',
  referenz: 'Referenz',
  hilfsmittel: 'Hilfsmittel',
  karten: 'Karteikarten',
  moodle: 'Moodle',
  quiz: 'Quiz',
  schema: 'Schema',
}

/** Einheitliche Reihenfolge der gemeinsamen Tabs (Sonderfälle wie 'schema' hängen die Apps hinten an). */
export const STANDARD_TAB_REIHENFOLGE = ['uebung', 'referenz', 'hilfsmittel', 'karten', 'moodle', 'quiz'] as const

/** TabDefs für die Tab-Leiste aus Standard-IDs bauen (Label + Icon zentral). */
export function tabDefs<T extends string>(ids: readonly T[]): TabDef<T>[] {
  return ids.map(id => ({ id, label: LABELS[id] ?? id, icon: ICONS[id] }))
}
