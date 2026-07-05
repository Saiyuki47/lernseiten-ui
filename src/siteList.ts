export interface LernSeite {
  key: string
  label: string
  url: string
}

// Die Lernfächer als GitHub-Pages-Projektseiten. Zentrale Liste, damit alle
// Seiten konsistent aufeinander verlinken. (Eigene Datei, damit die Komponente
// SiteNav.tsx nur Komponenten exportiert — Fast-Refresh/only-export-components.)
export const LERNSEITEN: LernSeite[] = [
  { key: 'algebraische', label: 'Algebraische Grundlagen', url: 'https://saiyuki47.github.io/Algebraische-Grundlagen/' },
  { key: 'mathe', label: 'Mathematische Grundlagen', url: 'https://saiyuki47.github.io/Mathematische-Grundlagen/' },
  { key: 'bwl', label: 'Betriebswirtschaftslehre 1', url: 'https://saiyuki47.github.io/Betriebswirtschaftslehre-1/' },
  { key: 'datenbanken', label: 'Datenbanksysteme', url: 'https://saiyuki47.github.io/Datenbanksysteme/' },
]

// Tab-IDs (erstes Hash-Segment) je Seite – für die Tab-Mitnahme beim
// Seitenwechsel im SiteNav. Muss den TABS-Listen der App.tsx entsprechen;
// fehlt ein Tab hier, landet der Wechsel schlimmstenfalls auf dem
// Standard-Tab der Zielseite (useHashTab-Fallback), nie auf einem Fehler.
const SITE_TABS: Record<string, readonly string[]> = {
  algebraische: ['uebung', 'referenz', 'formelsammlung', 'moodle', 'quiz', 'karten'],
  mathe: ['uebung', 'referenz', 'hilfsmittel', 'moodle', 'quiz', 'karten'],
  bwl: ['uebung', 'formeln', 'drucken', 'moodle', 'quiz', 'karten'],
  datenbanken: ['uebung', 'themen', 'schema', 'moodle', 'quiz', 'karten'],
}

// Das „Nachschlage"-Tab heißt je Seite anders – diese Tabs gelten beim
// Seitenwechsel als gleichwertig (Referenz ↔ Formeln ↔ Themen).
const REFERENZ_FAMILIE: readonly string[] = ['referenz', 'formeln', 'themen']

/**
 * Ziel-URL beim Seitenwechsel: nimmt NUR den aktuellen Tab mit (erstes
 * Hash-Segment – Details wie Blatt/Aufgabe sind seitenspezifisch und werden
 * bewusst verworfen). Hat die Zielseite keinen entsprechenden Tab, bleibt es
 * bei der nackten URL (= deren Standard-Tab).
 */
export function siteWechselUrl(site: LernSeite, aktuellerTab?: string): string {
  const tabs = SITE_TABS[site.key]
  if (!aktuellerTab || !tabs) return site.url
  if (tabs.includes(aktuellerTab)) return `${site.url}#${aktuellerTab}`
  if (REFERENZ_FAMILIE.includes(aktuellerTab)) {
    const eq = REFERENZ_FAMILIE.find(t => tabs.includes(t))
    if (eq) return `${site.url}#${eq}`
  }
  return site.url
}
