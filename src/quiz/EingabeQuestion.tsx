import { useState } from 'react'
import type { QuizEingabe } from '../types'

// ---------------------------------------------------------------------------
// Fragetyp: Freie Eingabe (Text / Zahl mit Toleranz)
// ---------------------------------------------------------------------------
function normalizeText(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}
function toNumber(s: string): number {
  return Number(s.replace(/\s/g, '').replace(',', '.'))
}
function eingabeRichtig(q: QuizEingabe, value: string): boolean {
  if (q.toleranz !== undefined) {
    const v = toNumber(value)
    return Number.isFinite(v) && q.loesungen.some(l => Math.abs(v - toNumber(l)) <= (q.toleranz ?? 0))
  }
  const nv = normalizeText(value)
  return q.loesungen.some(l => normalizeText(l) === nv)
}

export function EingabeQuestion({ q, onDone }: { q: QuizEingabe; onDone: (correct: boolean) => void }) {
  const [value, setValue] = useState('')
  const [revealed, setRevealed] = useState(false)
  const richtig = eingabeRichtig(q, value)

  const check = () => {
    if (revealed || value.trim() === '') return
    setRevealed(true)
    onDone(richtig)
  }

  return (
    <>
      <p className="quiz-hint">{q.toleranz !== undefined ? 'Zahl eingeben.' : 'Antwort eintippen.'}</p>
      <form className="eingabe-form" onSubmit={e => { e.preventDefault(); check() }}>
        <input
          className="eingabe-input"
          type="text"
          value={value}
          disabled={revealed}
          placeholder={q.platzhalter ?? 'Deine Antwort…'}
          aria-label="Antwort"
          onChange={e => setValue(e.target.value)}
        />
        {!revealed && (
          <button type="submit" className="nav-btn quiz-check-btn" disabled={value.trim() === ''}>Prüfen</button>
        )}
      </form>
      {revealed && (
        <div className={`quiz-feedback-box ${richtig ? 'is-correct' : 'is-wrong'}`}>
          <p className="quiz-feedback-head">{richtig ? '✓ Richtig!' : '✗ Leider falsch'}</p>
          {!richtig && <p className="quiz-feedback-correct">Richtige Antwort: {q.loesungen[0]}</p>}
          <p className="quiz-feedback-exp">{q.erklaerung}</p>
        </div>
      )}
    </>
  )
}
