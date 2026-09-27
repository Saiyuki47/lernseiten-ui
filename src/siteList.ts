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
  { key: 'gitarre', label: 'Gitarre: Go K.K. Rider', url: 'https://saiyuki47.github.io/Animal-Crossing-Gitarre/' },
]

// Tab-IDs (erstes Hash-Segment) je Seite – für die Tab-Mitnahme beim
// Seitenwechsel im SiteNav. Die IDs sind über alle Seiten vereinheitlicht
// (uebung/referenz/hilfsmittel/moodle/quiz/karten); 'schema' ist der
// Datenbanken-Sonderfall, 'werkzeuge' ersetzt bei der Gitarren-Seite 'moodle'. Muss den TABS-Listen der App.tsx entsprechen;
// fehlt ein Tab hier, landet der Wechsel schlimmstenfalls auf dem
// Standard-Tab der Zielseite (useHashTab-Fallback), nie auf einem Fehler.
const GEMEINSAME_TABS = ['uebung', 'referenz', 'hilfsmittel', 'moodle', 'quiz', 'karten'] as const
const SITE_TABS: Record<string, readonly string[]> = {
  algebraische: GEMEINSAME_TABS,
  mathe: GEMEINSAME_TABS,
  bwl: GEMEINSAME_TABS,
  datenbanken: [...GEMEINSAME_TABS, 'schema'],
  gitarre: ['uebung', 'referenz', 'hilfsmittel', 'werkzeuge', 'quiz', 'karten'],
}

/**
 * Ziel-URL beim Seitenwechsel: nimmt NUR den aktuellen Tab mit (erstes
 * Hash-Segment – Details wie Blatt/Aufgabe sind seitenspezifisch und werden
 * bewusst verworfen). Hat die Zielseite keinen entsprechenden Tab (z.B.
 * Datenbanken-'schema'), bleibt es bei der nackten URL (= deren Standard-Tab).
 */
export function siteWechselUrl(site: LernSeite, aktuellerTab?: string): string {
  const tabs = SITE_TABS[site.key]
  if (!aktuellerTab || !tabs) return site.url
  if (tabs.includes(aktuellerTab)) return `${site.url}#${aktuellerTab}`
  return site.url
}
