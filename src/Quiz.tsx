import { useState, useCallback, type CSSProperties } from 'react'
import { useQuizProgress } from './useQuizProgress'
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

// ---------------------------------------------------------------------------
// Quiz-Hauptkomponente. Die Fragen kommen als Prop (`fragen`), damit die Engine
// inhaltsunabhängig bleibt und von allen Lernseiten geteilt werden kann.
// ---------------------------------------------------------------------------
type Phase = 'playing' | 'answered' | 'finished'

export function Quiz({ fragen }: { fragen: QuizFrage[] }) {
  const { streak, today, yesterday, recordCorrect } = useQuizProgress()
  const [qi, setQi] = useState(0)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState<Phase>('playing')
  const [order, setOrder] = useState<number[]>(() => shuffleIndices(fragen.length))

  const total = fragen.length
  const q = fragen[order[qi]]
  const progress = total > 0 ? Math.round((qi / total) * 100) : 0

  const handleDone = useCallback((correct: boolean) => {
    setPhase('answered')
    if (correct) {
      setScore(s => s + 1)
      recordCorrect()
    }
  }, [recordCorrect])

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
    setOrder(shuffleIndices(fragen.length))
  }, [fragen])

  const header = (
    <div className="section-header">
      <h2>Quiz</h2>
      <p>Teste dein Wissen mit {total} Fragen in verschiedenen Aufgabentypen.</p>
    </div>
  )

  if (total === 0 || !q) {
    return (
      <div>
        {header}
        <div className="card"><p className="quiz-hint">Noch keine Quizfragen vorhanden.</p></div>
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
        {header}
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

  return (
    <div>
      {header}
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
