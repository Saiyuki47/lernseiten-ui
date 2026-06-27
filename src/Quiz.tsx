import { useState, useCallback, useMemo, useRef, type CSSProperties } from 'react'
import { useQuizProgress } from './useQuizProgress'
import { useWrongTracker } from './useWrongTracker'
import type { QuizFrage } from './types'
import { ProgressBadges } from './quiz/ProgressBadges'
import { SingleQuestion } from './quiz/SingleQuestion'
import { MultiQuestion } from './quiz/MultiQuestion'
import { ZuordnungQuestion } from './quiz/ZuordnungQuestion'
import { ReihenfolgeQuestion } from './quiz/ReihenfolgeQuestion'
import { KategorienQuestion } from './quiz/KategorienQuestion'
import { EingabeQuestion } from './quiz/EingabeQuestion'
import { WahrFalschQuestion } from './quiz/WahrFalschQuestion'
import { shuffleIndices } from './quiz/shuffle'
import { useEnterKey } from './useNumberKeys'

// ---------------------------------------------------------------------------
// Quiz-Hauptkomponente. Die Fragen kommen als Prop (`fragen`), damit die Engine
// inhaltsunabhängig bleibt und von allen Lernseiten geteilt werden kann.
//
// Aufbau: `Quiz` zeigt die Filterleiste (alle / pro Übungsblatt / nur falsche)
// und wählt damit die aktive Fragenmenge; `QuizRun` spielt eine *feste* Menge
// durch. Beim Filterwechsel erzwingt `key={filter}` einen frischen Durchlauf.
// ---------------------------------------------------------------------------
type Phase = 'playing' | 'answered' | 'finished'

// Gruppen-Label einer Frage, z.B. "Übungsblatt 3" aus quelle "Übungsblatt 3, Aufgabe 2".
function gruppeVon(f: QuizFrage): string {
  return f.quelle ? f.quelle.split(',')[0].trim() : 'Ohne Quelle'
}

export function Quiz({ fragen }: { fragen: QuizFrage[] }) {
  const { wrongIds, markAnswer } = useWrongTracker()
  const [filter, setFilter] = useState<string>('alle')

  // Distinkte Übungsblatt-Gruppen in Datenreihenfolge.
  const gruppen = useMemo(() => {
    const gesehen = new Set<string>()
    const reihenfolge: string[] = []
    for (const f of fragen) {
      const g = gruppeVon(f)
      if (!gesehen.has(g)) {
        gesehen.add(g)
        reihenfolge.push(g)
      }
    }
    return reihenfolge
  }, [fragen])

  const falscheAnzahl = useMemo(
    () => fragen.reduce((n, f) => (wrongIds.has(f.frage) ? n + 1 : n), 0),
    [fragen, wrongIds],
  )

  const aktiveFragen = useMemo(() => {
    if (filter === 'falsche') return fragen.filter(f => wrongIds.has(f.frage))
    if (filter === 'alle') return fragen
    return fragen.filter(f => gruppeVon(f) === filter)
    // wrongIds bewusst nur für den "falsche"-Filter relevant; Snapshot reicht.
  }, [fragen, filter, wrongIds])

  return (
    <div>
      <div className="section-header">
        <h2>Quiz</h2>
        <p>Teste dein Wissen mit {fragen.length} Fragen – optional pro Übungsblatt oder nur deine falschen.</p>
      </div>

      <div className="filter-row">
        <button
          type="button"
          className={`filter-btn${filter === 'alle' ? ' on' : ''}`}
          onClick={() => setFilter('alle')}
        >
          Alle ({fragen.length})
        </button>
        {gruppen.length > 1 &&
          gruppen.map(g => (
            <button
              type="button"
              key={g}
              className={`filter-btn${filter === g ? ' on' : ''}`}
              onClick={() => setFilter(g)}
            >
              {g}
            </button>
          ))}
        {falscheAnzahl > 0 && (
          <button
            type="button"
            className={`filter-btn${filter === 'falsche' ? ' on' : ''}`}
            onClick={() => setFilter('falsche')}
          >
            🔁 Nur falsche ({falscheAnzahl})
          </button>
        )}
      </div>

      <QuizRun key={filter} fragen={aktiveFragen} onAnswer={markAnswer} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Spielt eine feste Fragenmenge durch (Reihenfolge + Optionen gemischt).
// ---------------------------------------------------------------------------
function QuizRun({
  fragen,
  onAnswer,
}: {
  fragen: QuizFrage[]
  onAnswer: (id: string, correct: boolean) => void
}) {
  const { streak, today, yesterday, recordCorrect } = useQuizProgress()
  // Fragenmenge beim Mount einfrieren – spätere Prop-Änderungen (z.B. wenn der
  // "falsche"-Zähler schrumpft) sollen den laufenden Durchgang nicht stören.
  const runFragen = useRef(fragen).current
  const [qi, setQi] = useState(0)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState<Phase>('playing')
  const [order, setOrder] = useState<number[]>(() => shuffleIndices(runFragen.length))

  const total = runFragen.length
  const q = runFragen[order[qi]]

  const handleDone = useCallback(
    (correct: boolean) => {
      setPhase('answered')
      onAnswer(q.frage, correct)
      if (correct) {
        setScore(s => s + 1)
        recordCorrect()
      }
    },
    [recordCorrect, onAnswer, q],
  )

  const handleNext = useCallback(() => {
    if (qi + 1 >= total) {
      setPhase('finished')
    } else {
      setQi(i => i + 1)
      setPhase('playing')
    }
  }, [qi, total])

  const handleReset = useCallback(() => {
    setQi(0)
    setScore(0)
    setPhase('playing')
    setOrder(shuffleIndices(runFragen.length))
  }, [runFragen])

  // Enter springt zur nächsten Frage, sobald beantwortet (Zifferntasten 1–n
  // wählen Optionen in Single/Mehrfachauswahl).
  useEnterKey(handleNext, phase === 'answered')

  if (total === 0 || !q) {
    return (
      <div className="card">
        <p className="quiz-hint">Keine Fragen in dieser Auswahl. 🎉</p>
      </div>
    )
  }

  if (phase === 'finished') {
    const pct = Math.round((score / total) * 100)
    const msg =
      score >= Math.ceil(total * 0.8)
        ? 'Ausgezeichnet! Du hast das Thema gut verstanden.'
        : score >= Math.ceil(total * 0.5)
        ? 'Gut! Mit etwas mehr Übung schaffst du es.'
        : 'Schau nochmal in die Aufgaben und Lösungen!'
    return (
      <div>
        <ProgressBadges streak={streak} today={today} yesterday={yesterday} />
        <div className="card">
          <div className="progress-wrap"><div className="progress-bar progress-bar--full" /></div>
          <div className="result-box">
            <div className="result-score">{score}/{total}</div>
            <p className="result-label">{pct}% richtig &mdash; {msg}</p>
            <button type="button" className="nav-btn" onClick={handleReset}>↺ Nochmal starten</button>
          </div>
        </div>
      </div>
    )
  }

  const answered = phase === 'answered'
  const progress = total > 0 ? Math.round((qi / total) * 100) : 0

  return (
    <div>
      <ProgressBadges streak={streak} today={today} yesterday={yesterday} />
      <div className="card">
        <div className="progress-wrap">
          <div className="progress-bar" style={{ '--bar-w': `${progress}%` } as CSSProperties} />
        </div>
        <p className="quiz-num">Frage {qi + 1} / {total} · {labelFor(q.art)}</p>
        <p className="quiz-q">{q.frage}</p>

        {q.art === 'single' && <SingleQuestion key={order[qi]} q={q} onDone={handleDone} />}
        {q.art === 'multi' && <MultiQuestion key={order[qi]} q={q} onDone={handleDone} />}
        {q.art === 'zuordnung' && <ZuordnungQuestion key={order[qi]} q={q} onDone={handleDone} />}
        {q.art === 'reihenfolge' && <ReihenfolgeQuestion key={order[qi]} q={q} onDone={handleDone} />}
        {q.art === 'kategorien' && <KategorienQuestion key={order[qi]} q={q} onDone={handleDone} />}
        {q.art === 'eingabe' && <EingabeQuestion key={order[qi]} q={q} onDone={handleDone} />}
        {q.art === 'wahrfalsch' && <WahrFalschQuestion key={order[qi]} q={q} onDone={handleDone} />}

        <div className="quiz-nav">
          <span className="score-pill">{score} / {qi + (answered ? 1 : 0)} richtig{q.quelle ? ` · ${q.quelle}` : ''}</span>
          <button type="button" className="nav-btn" disabled={!answered} onClick={handleNext}>
            {qi + 1 >= total ? 'Ergebnis →' : 'Weiter →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Kurzlabel für den Fragetyp (im Frage-Zähler angezeigt).
const TYP_LABEL: Record<QuizFrage['art'], string> = {
  single: 'Single-Choice',
  multi: 'Mehrfachauswahl',
  zuordnung: 'Zuordnung',
  reihenfolge: 'Reihenfolge',
  kategorien: 'Kategorisieren',
  eingabe: 'Eingabe',
  wahrfalsch: 'Wahr/Falsch',
}
function labelFor(art: QuizFrage['art']): string {
  return TYP_LABEL[art]
}
