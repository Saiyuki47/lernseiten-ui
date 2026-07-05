// --- Quiz ---
// Acht Fragetypen mit reichem Feedback. Jede Option kann begründen, warum sie
// (bei falscher Wahl) nicht stimmt; jede Frage hat eine Erklärung der Lösung.
import type { ReactNode } from 'react'

export interface QuizOption {
  text: string
  /** Wird gezeigt, wenn diese (falsche) Option gewählt wurde: warum sie nicht stimmt. */
  warumFalsch?: string
}

interface QuizBasis {
  frage: string
  /** Erklärung der korrekten Lösung – wird nach dem Beantworten immer gezeigt. */
  erklaerung: string
  /** Optionale Quelle, z.B. "Übungsblatt 3, Aufgabe 2" oder "1.2 Wirtschaftliches Handeln". */
  quelle?: string
  /** Optionaler Gruppen-Schlüssel für den Filter-Chip (überschreibt quelle.split(',')[0]). */
  gruppe?: string
  /** Optionale Seitenzahl der Quelle (z.B. PDF-Seite). */
  seite?: number
  /** Optionale zweite Quellen-Angabe (Freitext), z.B. "Folien vom Lehrer, Seite 12". */
  zusatzQuelle?: string
  /** Optionale (nachgebaute) Abbildung – wird in der Lösung nach dem Beantworten gezeigt. */
  bild?: ReactNode
  /** Zusatzfrage (z.B. Leons Unterlagen): im "Alle"-Modus per Schalter ausblendbar. */
  extra?: boolean
}

/** Single-Choice: genau eine von vier Optionen ist richtig. */
export interface QuizSingle extends QuizBasis {
  art: 'single'
  optionen: QuizOption[]
  /** Index der richtigen Option. */
  richtige: number
}

/** Multiple-Select: mehrere von vier Optionen sind richtig (anklicken, dann prüfen). */
export interface QuizMulti extends QuizBasis {
  art: 'multi'
  optionen: QuizOption[]
  /** Indizes aller richtigen Optionen. */
  richtige: number[]
}

/** Zuordnung per Drag & Drop: jeder Begriff wird seinem passenden Ziel zugeordnet. */
export interface QuizZuordnung extends QuizBasis {
  art: 'zuordnung'
  /** Begriff (zieht man) und das korrekt zugehörige Ziel. Ziele müssen eindeutig sein. */
  paare: { begriff: string; ziel: string }[]
}

/** Reihenfolge: Schritte/Items per Drag in die richtige Reihenfolge bringen. */
export interface QuizReihenfolge extends QuizBasis {
  art: 'reihenfolge'
  /** Items in der KORREKTEN Reihenfolge (werden gemischt angezeigt). */
  schritte: string[]
}

/** Kategorisieren: jedes Item per Drag in seine korrekte Kategorie einsortieren. */
export interface QuizKategorien extends QuizBasis {
  art: 'kategorien'
  kategorien: string[]
  items: { text: string; kategorie: string }[]
}

/** Freie Eingabe: Antwort eintippen. Bei gesetzter Toleranz numerischer Vergleich. */
export interface QuizEingabe extends QuizBasis {
  art: 'eingabe'
  /** Akzeptierte Antworten (normalisiert verglichen). */
  loesungen: string[]
  /** Optionale numerische Toleranz; wenn gesetzt, wird als Zahl verglichen. */
  toleranz?: number
  /** Optionaler Platzhalter im Eingabefeld (z.B. Einheit). */
  platzhalter?: string
}

/** Wahr/Falsch: mehrere Aussagen, jede als wahr oder falsch markieren. */
export interface QuizWahrFalsch extends QuizBasis {
  art: 'wahrfalsch'
  aussagen: { text: string; wahr: boolean; warum?: string }[]
}

/** Ein Beschriftungs-Slot: leerer Kasten in einer Abbildung, in viewBox-Einheiten. */
export interface BeschriftungSlot {
  /** Korrekter Begriff – zugleich Chip-Text im Pool und Vergleichsbasis. */
  label: string
  x: number
  y: number
  w: number
  h: number
  /**
   * Austausch-Gruppe: Slots mit derselben Gruppe akzeptieren ihre Labels in
   * beliebiger Verteilung (für gleichwertige Positionen, z.B. parallele
   * Anspruchsgruppen). Ohne Gruppe muss exakt der eigene Label sitzen.
   */
  gruppe?: string
}

/**
 * Abbildung beschriften: eine Abbildung ohne Begriffe wird gezeigt; die
 * Begriffe werden per Drag & Drop (oder Klick-Zuordnung) in die leeren Kästen
 * gezogen. Die vollständige Abbildung gehört in `bild` (Lösung nach dem
 * Beantworten). Slot-Koordinaten sind viewBox-Einheiten des SVG in `bildLeer`.
 */
export interface QuizBeschriftung extends QuizBasis {
  art: 'beschriftung'
  /** Abbildung ohne die gesuchten Begriffe (SVG mit width:100%). */
  bildLeer: ReactNode
  /** viewBox-Breite des SVG – für die prozentuale Overlay-Umrechnung. */
  viewBoxW: number
  /** viewBox-Höhe des SVG. */
  viewBoxH: number
  /** Maximale Darstellungsbreite in px (entspricht dem maxWidth des SVG). */
  maxWidth?: number
  slots: BeschriftungSlot[]
}

export type QuizFrage =
  | QuizSingle
  | QuizMulti
  | QuizZuordnung
  | QuizReihenfolge
  | QuizKategorien
  | QuizEingabe
  | QuizWahrFalsch
  | QuizBeschriftung
