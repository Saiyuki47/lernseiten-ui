import { useState, useMemo } from 'react'
import type { QuizMulti } from '../types'
import { shuffleIndices } from './shuffle'

function MultiFeedback({ q, sel }: { q: QuizMulti; sel: Set<number> }) {
  const correctSet = new Set(q.richtige)
  const allCorrect = sel.size === correctSet.size && [...sel].every(i => correctSet.has(i))
  const falschGewaehlt = [...sel].filter(i => !correctSet.has(i))
  const verpasst = q.richtige.filter(i => !sel.has(i))
  return (
    <div className={`quiz-feedback-box ${allCorrect ? 'is-correct' : 'is-wrong'}`}>
      <p className="quiz-feedback-head">{allCorrect ? '✓ Alles richtig!' : '✗ Nicht ganz'}</p>
      {falschGewaehlt.map(i =>
        q.optionen[i].warumFalsch ? (
          <p className="quiz-feedback-why" key={q.optionen[i].text}>
            Falsch gewählt „{q.optionen[i].text}": {q.optionen[i].warumFalsch}
          </p>
        ) : null,
      )}
      {verpasst.length > 0 && (
        <p className="quiz-feedback-correct">
          Fehlend: {verpasst.map(i => q.optionen[i].text).join(', ')}
        </p>
      )}
      <p className="quiz-feedback-exp">{q.erklaerung}</p>
    </div>
  )
}


// ---------------------------------------------------------------------------
// Fragetyp: Mehrfachauswahl
// ---------------------------------------------------------------------------
export function MultiQuestion({ q, onDone }: { q: QuizMulti; onDone: (correct: boolean) => void }) {
  const [sel, setSel] = useState<Set<number>>(new Set())
  const [revealed, setRevealed] = useState(false)
  const [perm] = useState(() => shuffleIndices(q.optionen.length))
  const correctSet = useMemo(() => new Set(q.richtige), [q.richtige])

  const toggle = (i: number) => {
    if (revealed) return
    setSel(prev => {
      const n = new Set(prev)
      if (n.has(i)) n.delete(i)
      else n.add(i)
      return n
    })
  }

  const check = () => {
    if (revealed || sel.size === 0) return
    setRevealed(true)
    onDone(sel.size === correctSet.size && [...sel].every(i => correctSet.has(i)))
  }

  return (
    <>
      <p className="quiz-hint">Mehrere Antworten möglich – alle richtigen auswählen, dann prüfen.</p>
      <div className="options">
        {perm.map(i => {
          const opt = q.optionen[i]
          const isSel = sel.has(i)
          let cls = 'opt-btn opt-btn--check'
          if (isSel && !revealed) cls += ' selected'
          if (revealed) {
            if (correctSet.has(i)) cls += ' correct'
            else if (isSel) cls += ' wrong'
          }
          return (
            <button
              type="button"
              key={opt.text}
              className={cls}
              disabled={revealed}
              aria-pressed={isSel}
              onClick={() => toggle(i)}
            >
              <span className="opt-check" aria-hidden="true">{isSel ? '☑' : '☐'}</span> {opt.text}
            </button>
          )
        })}
      </div>
      {!revealed ? (
        <button type="button" className="nav-btn quiz-check-btn" disabled={sel.size === 0} onClick={check}>
          Prüfen
        </button>
      ) : (
        <MultiFeedback q={q} sel={sel} />
      )}
    </>
  )
}
