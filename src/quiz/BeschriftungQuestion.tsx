import { useState } from 'react'
import type { QuizBeschriftung } from '../types'
import { shuffleIndices } from './shuffle'

// ---------------------------------------------------------------------------
// Fragetyp: Abbildung beschriften (Drag & Drop + Klick-Zuordnung als
// barrierearme Alternative). Die leere Abbildung (SVG) wird gerendert; über
// den leeren Kästen liegen absolut positionierte Drop-Zonen, deren Position
// aus den viewBox-Koordinaten der Slots in Prozent umgerechnet wird – so
// bleiben Bild und Zonen bei jeder Breite deckungsgleich.
// ---------------------------------------------------------------------------

// Gruppen-Schlüssel eines Slots: explizite Austausch-Gruppe oder der Slot selbst.
function slotGruppe(q: QuizBeschriftung, i: number): string {
  return q.slots[i].gruppe ?? `__solo-${i}`
}

/**
 * Pro Slot: sitzt dort ein (innerhalb seiner Austausch-Gruppe) richtiger
 * Begriff? Innerhalb einer Gruppe wird jedes platzierte Label gegen die noch
 * offene Label-Multimenge der Gruppe abgeglichen (Reihenfolge egal).
 */
function bewerteSlots(q: QuizBeschriftung, assign: Record<number, number>): boolean[] {
  const ok = new Array<boolean>(q.slots.length).fill(false)
  const gruppen = new Map<string, number[]>()
  q.slots.forEach((_, i) => {
    const g = slotGruppe(q, i)
    const liste = gruppen.get(g)
    if (liste) liste.push(i)
    else gruppen.set(g, [i])
  })
  for (const idxs of gruppen.values()) {
    const offen = idxs.map(i => q.slots[i].label)
    for (const i of idxs) {
      const chip = assign[i]
      if (chip === undefined) continue
      const k = offen.indexOf(q.slots[chip].label)
      if (k >= 0) {
        ok[i] = true
        offen.splice(k, 1)
      }
    }
  }
  return ok
}

function BeschriftungFeedback({ q, correct }: { q: QuizBeschriftung; correct: boolean }) {
  return (
    <div className={`quiz-feedback-box ${correct ? 'is-correct' : 'is-wrong'}`}>
      <p className="quiz-feedback-head">
        {correct
          ? '✓ Alles richtig beschriftet!'
          : '✗ Nicht ganz – vergleiche mit der vollständigen Abbildung unten.'}
      </p>
      <p className="quiz-feedback-exp">{q.erklaerung}</p>
    </div>
  )
}

export function BeschriftungQuestion({
  q,
  onDone,
}: {
  q: QuizBeschriftung
  onDone: (correct: boolean) => void
}) {
  // Chips = die Labels der Slots (Index i gehört zu q.slots[i].label).
  // assign: Slot-Index -> Index des dort abgelegten Chips.
  const [assign, setAssign] = useState<Record<number, number>>({})
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [poolOrder] = useState(() => shuffleIndices(q.slots.length))

  const placed = new Set(Object.values(assign))
  const pool = poolOrder.filter(i => !placed.has(i))
  const allAssigned = pool.length === 0

  const place = (chipIdx: number, slotIdx: number) => {
    if (revealed) return
    setAssign(prev => {
      const next: Record<number, number> = {}
      for (const [s, c] of Object.entries(prev)) {
        if (c === chipIdx || Number(s) === slotIdx) continue // alten Platz räumen / Ziel freimachen
        next[Number(s)] = c
      }
      next[slotIdx] = chipIdx
      return next
    })
    setSelected(null)
  }

  const toPool = (chipIdx: number) => {
    if (revealed) return
    setAssign(prev => {
      const next: Record<number, number> = {}
      for (const [s, c] of Object.entries(prev)) if (c !== chipIdx) next[Number(s)] = c
      return next
    })
    setSelected(null)
  }

  const clickChip = (i: number) => {
    if (revealed) return
    setSelected(s => (s === i ? null : i))
  }

  const clickSlot = (slotIdx: number) => {
    if (revealed) return
    const here = assign[slotIdx]
    if (here !== undefined) {
      clickChip(here)
      return
    }
    if (selected !== null) place(selected, slotIdx)
  }

  const check = () => {
    if (revealed || !allAssigned) return
    setRevealed(true)
    onDone(bewerteSlots(q, assign).every(Boolean))
  }

  const verdicts = revealed ? bewerteSlots(q, assign) : null
  // Chip-Schrift skaliert mit der Bildbreite (Container-Query-Einheit), damit
  // sie zur SVG-Beschriftung passt; nach unten auf lesbare 9px begrenzt.
  const slotFont = `max(9px, ${((12 / q.viewBoxW) * 100).toFixed(3)}cqw)`

  return (
    <>
      <p className="quiz-hint">
        Ziehe jeden Begriff in seinen Kasten in der Abbildung (oder tippe Begriff &amp; Kasten
        nacheinander an).
      </p>

      <div
        className="zuordnung-pool"
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          const idx = Number(e.dataTransfer.getData('text/plain'))
          if (!Number.isNaN(idx)) toPool(idx)
        }}
      >
        {pool.length === 0 && <span className="zuordnung-pool-empty">Alle platziert</span>}
        {pool.map(i => (
          <button
            type="button"
            key={`${q.slots[i].label}-${i}`}
            className={`zuordnung-chip${selected === i ? ' selected' : ''}`}
            draggable={!revealed}
            onDragStart={e => e.dataTransfer.setData('text/plain', String(i))}
            onClick={() => clickChip(i)}
          >
            {q.slots[i].label}
          </button>
        ))}
      </div>

      <div className="beschriftung-stage" style={q.maxWidth ? { maxWidth: q.maxWidth } : undefined}>
        {q.bildLeer}
        {q.slots.map((s, si) => {
          const here = assign[si]
          const filled = here !== undefined
          let cls = 'beschriftung-slot'
          if (filled) cls += ' filled'
          if (verdicts) cls += verdicts[si] ? ' correct' : ' wrong'
          if (!filled && selected !== null && !revealed) cls += ' awaiting'
          return (
            <button
              type="button"
              key={`${s.label}-${si}`}
              className={cls}
              style={{
                left: `${((s.x / q.viewBoxW) * 100).toFixed(3)}%`,
                top: `${((s.y / q.viewBoxH) * 100).toFixed(3)}%`,
                width: `${((s.w / q.viewBoxW) * 100).toFixed(3)}%`,
                height: `${((s.h / q.viewBoxH) * 100).toFixed(3)}%`,
                fontSize: slotFont,
              }}
              aria-label={filled ? `Kasten belegt mit ${q.slots[here].label}` : 'Leerer Kasten'}
              draggable={filled && !revealed}
              onDragStart={e => filled && e.dataTransfer.setData('text/plain', String(here))}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                e.stopPropagation()
                const idx = Number(e.dataTransfer.getData('text/plain'))
                if (!Number.isNaN(idx)) place(idx, si)
              }}
              onClick={() => clickSlot(si)}
            >
              {filled ? q.slots[here].label : ''}
            </button>
          )
        })}
      </div>

      {!revealed ? (
        <button type="button" className="nav-btn quiz-check-btn" disabled={!allAssigned} onClick={check}>
          Prüfen
        </button>
      ) : (
        <BeschriftungFeedback q={q} correct={verdicts?.every(Boolean) ?? false} />
      )}
    </>
  )
}
