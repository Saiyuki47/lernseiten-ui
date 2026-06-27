import { useState } from 'react'
import type { QuizSingle } from '../types'
import { shuffleIndices } from './shuffle'

function SingleFeedback({ q, picked }: { q: QuizSingle; picked: number }) {
  const correct = picked === q.richtige
  return (
    <div className={`quiz-feedback-box ${correct ? 'is-correct' : 'is-wrong'}`}>
      <p className="quiz-feedback-head">{correct ? '✓ Richtig!' : '✗ Leider falsch'}</p>
      {!correct && q.optionen[picked].warumFalsch && (
        <p className="quiz-feedback-why">Deine Antwort „{q.optionen[picked].text}": {q.optionen[picked].warumFalsch}</p>
      )}
      {!correct && (
        <p className="quiz-feedback-correct">Richtig wäre: {q.optionen[q.richtige].text}</p>
      )}
      <p className="quiz-feedback-exp">{q.erklaerung}</p>
    </div>
  )
}


// ---------------------------------------------------------------------------
// Fragetyp: Single-Choice
// ---------------------------------------------------------------------------
export function SingleQuestion({ q, onDone }: { q: QuizSingle; onDone: (correct: boolean) => void }) {
  const [picked, setPicked] = useState<number | null>(null)
  const [perm] = useState(() => shuffleIndices(q.optionen.length))
  const revealed = picked !== null

  const pick = (i: number) => {
    if (revealed) return
    setPicked(i)
    onDone(i === q.richtige)
  }

  return (
    <>
      <div className="options">
        {perm.map(i => {
          const opt = q.optionen[i]
          let cls = 'opt-btn'
          if (revealed) {
            if (i === q.richtige) cls += ' correct'
            else if (i === picked) cls += ' wrong'
          }
          return (
            <button type="button" key={opt.text} className={cls} disabled={revealed} onClick={() => pick(i)}>
              {opt.text}
            </button>
          )
        })}
      </div>
      {picked !== null && <SingleFeedback q={q} picked={picked} />}
    </>
  )
}
