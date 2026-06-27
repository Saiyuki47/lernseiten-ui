import { useRef, useState, useCallback, type CSSProperties } from 'react'
import { useNumberKeys, useEnterKey } from './useNumberKeys'

// Eine Karteikarte – Inhalt kommt aus der jeweiligen Lernseite (front/back als Text).
export interface FlashCard {
  id?: string
  front: string
  back: string
  tag?: string
}

interface Sched {
  ef: number // Easiness-Faktor
  rep: number // Anzahl erfolgreicher Wiederholungen in Folge
  interval: number // Tage bis zur nächsten Fälligkeit
  due: number // fällig ab (Epochentag)
}
type Sm2Store = Record<string, Sched>

const DAY = 86400000
const todayDay = () => Math.floor(Date.now() / DAY)

// Pro Lernseite getrennt (wie die übrigen Tracker).
const storeKey = () => `flashcards:${(typeof document !== 'undefined' && document.title) || 'default'}`

function readStore(): Sm2Store {
  try {
    const raw = localStorage.getItem(storeKey())
    if (raw) {
      const o = JSON.parse(raw)
      if (o && typeof o === 'object' && !Array.isArray(o)) return o as Sm2Store
    }
  } catch {
    /* ignorieren */
  }
  return {}
}
function writeStore(s: Sm2Store) {
  try {
    localStorage.setItem(storeKey(), JSON.stringify(s))
  } catch {
    /* ignorieren */
  }
}

// SM-2 (SuperMemo 2): quality 0..5; < 3 = nicht gewusst → Wiederholung zurücksetzen.
function sm2(prev: Sched | undefined, q: number): Sched {
  let ef = (prev?.ef ?? 2.5) + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  if (ef < 1.3) ef = 1.3
  let rep = prev?.rep ?? 0
  let interval: number
  if (q < 3) {
    rep = 0
    interval = 1
  } else {
    rep += 1
    if (rep === 1) interval = 1
    else if (rep === 2) interval = 6
    else interval = Math.round((prev?.interval ?? 1) * ef)
  }
  return { ef, rep, interval, due: todayDay() + interval }
}

const cardId = (c: FlashCard): string => c.id ?? c.front

function buildQueue(cards: FlashCard[], store: Sm2Store, all: boolean): string[] {
  if (all) return cards.map(cardId)
  const t = todayDay()
  return cards.filter(c => {
    const s = store[cardId(c)]
    return !s || s.due <= t
  }).map(cardId)
}

const RATINGS: { q: number; label: string }[] = [
  { q: 0, label: '✗ Nochmal' },
  { q: 3, label: 'Schwer' },
  { q: 4, label: 'Gut' },
  { q: 5, label: 'Leicht' },
]

const faceStyle: CSSProperties = {
  minHeight: '7rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  fontSize: '1.15rem',
  lineHeight: 1.5,
  padding: '0.5rem 0',
  whiteSpace: 'pre-wrap',
}

// ---------------------------------------------------------------------------
// Karteikarten mit Spaced Repetition (SM-2). Fortschritt pro Lernseite in
// localStorage. Tastatur: Enter/Leertaste deckt auf, 1–4 bewertet.
// ---------------------------------------------------------------------------
export function Flashcards({ cards }: { cards: FlashCard[] }) {
  const storeRef = useRef<Sm2Store>(readStore())
  const [queue, setQueue] = useState<string[]>(() => buildQueue(cards, storeRef.current, false))
  const [pos, setPos] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const reveal = useCallback(() => setRevealed(true), [])

  const rate = useCallback(
    (q: number) => {
      const id = queue[pos]
      if (id === undefined) return
      storeRef.current = { ...storeRef.current, [id]: sm2(storeRef.current[id], q) }
      writeStore(storeRef.current)
      setRevealed(false)
      setPos(p => p + 1)
    },
    [queue, pos],
  )

  const restart = useCallback(
    (all: boolean) => {
      setQueue(buildQueue(cards, storeRef.current, all))
      setPos(0)
      setRevealed(false)
    },
    [cards],
  )

  useEnterKey(reveal, !revealed && pos < queue.length)
  useNumberKeys(RATINGS.length, i => rate(RATINGS[i].q), revealed)

  const header = (
    <div className="section-header">
      <h2>Karteikarten</h2>
      <p>Spaced Repetition: bewerte ehrlich, wie gut du es wusstest – fällige Karten kommen wieder.</p>
    </div>
  )

  if (cards.length === 0) {
    return (
      <div>
        {header}
        <div className="card"><p className="quiz-hint">Noch keine Karteikarten vorhanden.</p></div>
      </div>
    )
  }

  const fertig = pos >= queue.length
  if (fertig) {
    const faelligJetzt = buildQueue(cards, storeRef.current, false).length
    return (
      <div>
        {header}
        <div className="card">
          <div className="result-box">
            <div className="result-score">✓</div>
            <p className="result-label">
              {queue.length > 0 ? `${queue.length} Karte${queue.length === 1 ? '' : 'n'} durchgearbeitet.` : 'Nichts fällig.'}{' '}
              {faelligJetzt === 0 ? 'Aktuell ist nichts mehr fällig – komm später wieder.' : `Noch ${faelligJetzt} fällig.`}
            </p>
            <div className="filter-row" style={{ justifyContent: 'center' }}>
              {faelligJetzt > 0 && (
                <button type="button" className="nav-btn" onClick={() => restart(false)}>↺ Fällige üben</button>
              )}
              <button type="button" className="filter-btn" onClick={() => restart(true)}>Alle {cards.length} Karten üben</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const card = cards.find(c => cardId(c) === queue[pos])
  if (!card) {
    return (
      <div>
        {header}
        <div className="card"><p className="quiz-hint">Karte nicht gefunden.</p></div>
      </div>
    )
  }

  const progress = Math.round((pos / queue.length) * 100)

  return (
    <div>
      {header}
      <div className="card">
        <div className="progress-wrap">
          <div className="progress-bar" style={{ '--bar-w': `${progress}%` } as CSSProperties} />
        </div>
        <p className="quiz-num">Karte {pos + 1} / {queue.length}{card.tag ? ` · ${card.tag}` : ''}</p>

        <div style={faceStyle}>{card.front}</div>

        {!revealed ? (
          <button type="button" className="nav-btn" style={{ width: '100%' }} onClick={reveal}>
            Antwort zeigen (Enter)
          </button>
        ) : (
          <>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border, rgba(128,128,128,0.25))', margin: '0.25rem 0 0.75rem' }} />
            <div style={{ ...faceStyle, minHeight: '5rem', fontWeight: 500 }}>{card.back}</div>
            <div className="filter-row">
              {RATINGS.map((r, i) => (
                <button type="button" key={r.q} className="filter-btn" onClick={() => rate(r.q)}>
                  {i + 1}. {r.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
