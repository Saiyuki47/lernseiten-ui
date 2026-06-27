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
