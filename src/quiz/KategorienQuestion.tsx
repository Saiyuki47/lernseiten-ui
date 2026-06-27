import { useState } from 'react'
import type { QuizKategorien } from '../types'
import { shuffleIndices } from './shuffle'

// ---------------------------------------------------------------------------
// Fragetyp: Kategorisieren (Items in Töpfe einsortieren)
// ---------------------------------------------------------------------------
export function KategorienQuestion({ q, onDone }: { q: QuizKategorien; onDone: (correct: boolean) => void }) {
  const [placement, setPlacement] = useState<Record<number, string>>({})
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [poolOrder] = useState(() => shuffleIndices(q.items.length))
  const pool = poolOrder.filter(i => placement[i] === undefined)
  const allPlaced = pool.length === 0
  const richtig = !q.items.some((it, i) => placement[i] !== it.kategorie)

  const placeItem = (itemIdx: number, kat: string) => {
    if (revealed) return
    setPlacement(prev => ({ ...prev, [itemIdx]: kat }))
    setSelected(null)
  }
  const removeItem = (itemIdx: number) => {
    if (revealed) return
    setPlacement(prev => {
      const next = { ...prev }
      delete next[itemIdx]
      return next
    })
    setSelected(null)
  }

  const check = () => {
    if (revealed || !allPlaced) return
    setRevealed(true)
    onDone(richtig)
  }

  return (
    <>
      <p className="quiz-hint">Jedes Item in seine Kategorie ziehen – oder Item &amp; Kategorie anklicken.</p>
      <div
        className="kategorien-pool"
        onDragOver={e => e.preventDefault()}
        onDrop={e => { const idx = Number(e.dataTransfer.getData('text/plain')); if (!Number.isNaN(idx)) removeItem(idx) }}
      >
        {pool.length === 0 && <span className="zuordnung-pool-empty">Alle einsortiert</span>}
        {pool.map(i => (
          <button
            type="button"
            key={q.items[i].text}
            className={`zuordnung-chip${selected === i ? ' selected' : ''}`}
            draggable={!revealed}
            onDragStart={e => e.dataTransfer.setData('text/plain', String(i))}
            onClick={() => setSelected(s => (s === i ? null : i))}
          >
            {q.items[i].text}
          </button>
        ))}
      </div>
      <div className="kategorien-buckets">
        {q.kategorien.map(kat => {
          const inHere = q.items.flatMap((_, i) => (placement[i] === kat ? [i] : []))
          return (
            <div
              key={kat}
              className="kategorien-bucket"
              onDragOver={e => e.preventDefault()}
              onDrop={e => { const idx = Number(e.dataTransfer.getData('text/plain')); if (!Number.isNaN(idx)) placeItem(idx, kat) }}
            >
              <button
                type="button"
                className="kategorien-bucket-label"
                disabled={revealed}
                onClick={() => { if (selected !== null) placeItem(selected, kat) }}
              >
                {kat}
              </button>
              <div className="kategorien-bucket-items">
                {inHere.map(i => {
                  let cls = 'zuordnung-chip'
                  if (revealed) cls += q.items[i].kategorie === kat ? ' correct' : ' wrong'
                  return (
                    <button
                      type="button"
                      key={q.items[i].text}
                      className={cls}
                      draggable={!revealed}
                      onDragStart={e => e.dataTransfer.setData('text/plain', String(i))}
                      onClick={e => { e.stopPropagation(); removeItem(i) }}
                    >
                      {q.items[i].text}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      {!revealed ? (
        <button type="button" className="nav-btn quiz-check-btn" disabled={!allPlaced} onClick={check}>Prüfen</button>
      ) : (
        <div className={`quiz-feedback-box ${richtig ? 'is-correct' : 'is-wrong'}`}>
          <p className="quiz-feedback-head">{richtig ? '✓ Alles korrekt einsortiert!' : '✗ Nicht ganz – richtige Zuordnung:'}</p>
          <ul className="quiz-feedback-list">
            {q.items.map(it => <li key={it.text}><strong>{it.text}</strong> → {it.kategorie}</li>)}
          </ul>
          <p className="quiz-feedback-exp">{q.erklaerung}</p>
        </div>
      )}
    </>
  )
}
