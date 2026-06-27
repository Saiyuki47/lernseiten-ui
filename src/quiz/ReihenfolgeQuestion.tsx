import { useState, useRef } from 'react'
import type { QuizReihenfolge } from '../types'
import { shuffleIndices } from './shuffle'

// ---------------------------------------------------------------------------
// Fragetyp: Reihenfolge (Items per Drag/Pfeile sortieren)
// ---------------------------------------------------------------------------
export function ReihenfolgeQuestion({ q, onDone }: { q: QuizReihenfolge; onDone: (correct: boolean) => void }) {
  const [order, setOrder] = useState<number[]>(() => shuffleIndices(q.schritte.length))
  const [revealed, setRevealed] = useState(false)
  const dragPos = useRef<number | null>(null)
  const richtig = !order.some((v, i) => v !== i)

  const move = (from: number, to: number) => {
    if (revealed || from === to || to < 0 || to >= order.length) return
    setOrder(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  const check = () => {
    if (revealed) return
    setRevealed(true)
    onDone(richtig)
  }

  return (
    <>
      <p className="quiz-hint">In die richtige Reihenfolge bringen – ziehen oder mit ▲▼ verschieben.</p>
      <ol className="reihenfolge-list">
        {order.map((schrittIdx, pos) => {
          let cls = 'reihenfolge-item'
          if (revealed) cls += schrittIdx === pos ? ' correct' : ' wrong'
          return (
            <li
              key={q.schritte[schrittIdx]}
              className={cls}
              draggable={!revealed}
              onDragStart={() => { dragPos.current = pos }}
              onDragOver={e => e.preventDefault()}
              onDrop={() => { if (dragPos.current !== null) move(dragPos.current, pos); dragPos.current = null }}
            >
              <span className="reihenfolge-num">{pos + 1}</span>
              <span className="reihenfolge-text">{q.schritte[schrittIdx]}</span>
              {!revealed && (
                <span className="reihenfolge-arrows">
                  <button type="button" aria-label="nach oben" disabled={pos === 0} onClick={() => move(pos, pos - 1)}>▲</button>
                  <button type="button" aria-label="nach unten" disabled={pos === order.length - 1} onClick={() => move(pos, pos + 1)}>▼</button>
                </span>
              )}
            </li>
          )
        })}
      </ol>
      {!revealed ? (
        <button type="button" className="nav-btn quiz-check-btn" onClick={check}>Prüfen</button>
      ) : (
        <div className={`quiz-feedback-box ${richtig ? 'is-correct' : 'is-wrong'}`}>
          <p className="quiz-feedback-head">{richtig ? '✓ Richtige Reihenfolge!' : '✗ Nicht ganz – richtig wäre:'}</p>
          <ol className="quiz-feedback-list quiz-feedback-list--ol">
            {q.schritte.map(s => <li key={s}>{s}</li>)}
          </ol>
          <p className="quiz-feedback-exp">{q.erklaerung}</p>
        </div>
      )}
    </>
  )
}
