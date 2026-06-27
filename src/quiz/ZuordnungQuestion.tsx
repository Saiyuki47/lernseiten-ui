import { useState } from 'react'
import type { QuizZuordnung } from '../types'
import { shuffleIndices } from './shuffle'

function ZuordnungFeedback({ q, correct }: { q: QuizZuordnung; correct: boolean }) {
  return (
    <div className={`quiz-feedback-box ${correct ? 'is-correct' : 'is-wrong'}`}>
      <p className="quiz-feedback-head">{correct ? '✓ Alles richtig zugeordnet!' : '✗ Nicht ganz – richtige Zuordnung:'}</p>
      <ul className="quiz-feedback-list">
        {q.paare.map(p => (
          <li key={p.begriff}><strong>{p.begriff}</strong> → {p.ziel}</li>
        ))}
      </ul>
      <p className="quiz-feedback-exp">{q.erklaerung}</p>
    </div>
  )
}


// ---------------------------------------------------------------------------
// Fragetyp: Zuordnung (Drag & Drop + Klick-Zuordnung als barrierearme Alternative)
// ---------------------------------------------------------------------------
export function ZuordnungQuestion({ q, onDone }: { q: QuizZuordnung; onDone: (correct: boolean) => void }) {
  const begriffe = q.paare.map(p => p.begriff)
  const ziele = q.paare.map(p => p.ziel)
  // assign: ziel -> Index des dort abgelegten Begriffs
  const [assign, setAssign] = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [poolOrder] = useState(() => shuffleIndices(q.paare.length))

  const placed = new Set(Object.values(assign))
  const pool = poolOrder.filter(i => !placed.has(i))
  const allAssigned = pool.length === 0

  const place = (begriffIdx: number, ziel: string) => {
    if (revealed) return
    setAssign(prev => {
      const next: Record<string, number> = {}
      for (const [z, b] of Object.entries(prev)) {
        if (b === begriffIdx || z === ziel) continue // alten Slot räumen / Ziel freimachen
        next[z] = b
      }
      next[ziel] = begriffIdx
      return next
    })
    setSelected(null)
  }

  const toPool = (begriffIdx: number) => {
    if (revealed) return
    setAssign(prev => {
      const next: Record<string, number> = {}
      for (const [z, b] of Object.entries(prev)) if (b !== begriffIdx) next[z] = b
      return next
    })
    setSelected(null)
  }

  const clickBegriff = (i: number) => {
    if (revealed) return
    setSelected(s => (s === i ? null : i))
  }

  const clickZiel = (ziel: string) => {
    if (revealed || selected === null) return
    place(selected, ziel)
  }

  const check = () => {
    if (revealed || !allAssigned) return
    setRevealed(true)
    onDone(q.paare.every((p, i) => assign[p.ziel] === i))
  }

  return (
    <>
      <p className="quiz-hint">Ziehe jeden Begriff auf sein Ziel (oder klicke Begriff &amp; Ziel nacheinander an).</p>

      <div
        className="zuordnung-pool"
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          const idx = Number(e.dataTransfer.getData('text/plain'))
          if (!Number.isNaN(idx)) toPool(idx)
        }}
      >
        {pool.length === 0 && <span className="zuordnung-pool-empty">Alle zugeordnet</span>}
        {pool.map(i => (
          <button
            type="button"
            key={begriffe[i]}
            className={`zuordnung-chip${selected === i ? ' selected' : ''}`}
            draggable={!revealed}
            onDragStart={e => e.dataTransfer.setData('text/plain', String(i))}
            onClick={() => clickBegriff(i)}
          >
            {begriffe[i]}
          </button>
        ))}
      </div>

      <div className="zuordnung-targets">
        {ziele.map((ziel, zi) => {
          const here = assign[ziel]
          const filled = here !== undefined
          let cls = 'zuordnung-slot'
          if (revealed && filled) cls += assign[ziel] === zi ? ' correct' : ' wrong'
          return (
            <div
              key={ziel}
              className={cls}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                const idx = Number(e.dataTransfer.getData('text/plain'))
                if (!Number.isNaN(idx)) place(idx, ziel)
              }}
            >
              <span className="zuordnung-slot-label">{ziel}</span>
              <button
                type="button"
                className={`zuordnung-slot-drop${filled ? ' filled' : ''}`}
                onClick={() => (filled ? (revealed ? undefined : clickBegriff(here)) : clickZiel(ziel))}
                draggable={filled && !revealed}
                onDragStart={e => filled && e.dataTransfer.setData('text/plain', String(here))}
              >
                {filled ? begriffe[here] : 'hierher'}
              </button>
            </div>
          )
        })}
      </div>

      {!revealed ? (
        <button type="button" className="nav-btn quiz-check-btn" disabled={!allAssigned} onClick={check}>
          Prüfen
        </button>
      ) : (
        <ZuordnungFeedback q={q} correct={q.paare.every((p, i) => assign[p.ziel] === i)} />
      )}
    </>
  )
}
