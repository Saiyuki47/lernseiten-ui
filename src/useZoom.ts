import { useEffect, useState } from 'react'

// Wählbare Zoom-Stufen in Prozent (100 = normale Größe).
export const ZOOM_LEVELS = [50, 75, 100, 125, 150, 175, 200] as const
export type ZoomLevel = (typeof ZOOM_LEVELS)[number]

const STORAGE_KEY = 'zoom'
const DEFAULT_ZOOM: ZoomLevel = 100

function getStoredZoom(): ZoomLevel {
  const raw = Number(localStorage.getItem(STORAGE_KEY))
  return (ZOOM_LEVELS as readonly number[]).includes(raw) ? (raw as ZoomLevel) : DEFAULT_ZOOM
}

// Skaliert die gesamte Seite wie der Browser-Zoom (Strg + +). Der Wert liegt im
// localStorage und ist – da alle Lernseiten dieselbe Origin haben – für alle
// Seiten gemeinsam. Umgesetzt über die CSS-`zoom`-Eigenschaft auf <html>, damit
// das Layout sauber neu umbricht (anders als bei transform: scale()).
export function useZoom() {
  const [zoom, setZoom] = useState<ZoomLevel>(() => getStoredZoom())

  useEffect(() => {
    const root = document.documentElement.style
    if (zoom === 100) root.removeProperty('zoom')
    else root.setProperty('zoom', String(zoom / 100))
    localStorage.setItem(STORAGE_KEY, String(zoom))
  }, [zoom])

  return { zoom, setZoom }
}
