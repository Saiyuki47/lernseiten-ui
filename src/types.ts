// --- Quiz ---
// Sieben Fragetypen mit reichem Feedback. Jede Option kann begründen, warum sie
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
  /** Optionale Quelle, z.B. "Übungsblatt 3, Aufgabe 2". */
  quelle?: string
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

export type QuizFrage =
  | QuizSingle
  | QuizMulti
  | QuizZuordnung
  | QuizReihenfolge
  | QuizKategorien
  | QuizEingabe
  | QuizWahrFalsch
