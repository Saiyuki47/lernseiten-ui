import { useState } from 'react'
import type { QuizWahrFalsch } from '../types'
import { shuffleIndices } from './shuffle'

// ---------------------------------------------------------------------------
// Fragetyp: Wahr/Falsch-Aussagen
// ---------------------------------------------------------------------------
export function WahrFalschQuestion({ q, onDone }: { q: QuizWahrFalsch; onDone: (correct: boolean) => void }) {
  const [answers, setAnswers] = useState<Record<number, boolean>>({})
  const [revealed, setRevealed] = useState(false)
  const [perm] = useState(() => shuffleIndices(q.aussagen.length))
  const allAnswered = !q.aussagen.some((_, i) => answers[i] === undefined)
  const richtig = !q.aussagen.some((a, i) => answers[i] !== a.wahr)

  const setAns = (i: number, val: boolean) => {
    if (revealed) return
    setAnswers(prev => ({ ...prev, [i]: val }))
  }
  const check = () => {
    if (revealed || !allAnswered) return
    setRevealed(true)
    onDone(richtig)
  }

  return (
    <>
      <p className="quiz-hint">Für jede Aussage „Wahr" oder „Falsch" wählen.</p>
      <div className="wf-list">
        {perm.map(i => {
          const a = q.aussagen[i]
          const ans = answers[i]
          const isWrong = revealed && ans !== undefined && ans !== a.wahr
          let rowCls = 'wf-row'
          if (revealed) rowCls += ans === a.wahr ? ' correct' : ' wrong'
          return (
            <div key={a.text} className={rowCls}>
              <div className="wf-line">
                <span className="wf-text">{a.text}</span>
                <span className="wf-buttons">
                  <button type="button" className={`wf-btn${ans === true ? ' on' : ''}`} disabled={revealed} onClick={() => setAns(i, true)}>Wahr</button>
                  <button type="button" className={`wf-btn${ans === false ? ' on' : ''}`} disabled={revealed} onClick={() => setAns(i, false)}>Falsch</button>
                </span>
              </div>
              {isWrong && a.warum && <p className="wf-why">{a.warum}</p>}
            </div>
          )
        })}
      </div>
      {!revealed ? (
        <button type="button" className="nav-btn quiz-check-btn" disabled={!allAnswered} onClick={check}>Prüfen</button>
      ) : (
        <div className={`quiz-feedback-box ${richtig ? 'is-correct' : 'is-wrong'}`}>
          <p className="quiz-feedback-head">{richtig ? '✓ Alles richtig!' : '✗ Nicht alles richtig – siehe Markierungen oben.'}</p>
          <p className="quiz-feedback-exp">{q.erklaerung}</p>
        </div>
      )}
    </>
  )
}
