// ---------------------------------------------------------------------------
// Fortschritts-Badges (Streak / heute / gestern)
// ---------------------------------------------------------------------------
export function ProgressBadges({ streak, today, yesterday }: { streak: number; today: number; yesterday: number }) {
  return (
    <div className="quiz-stats">
      <span className="quiz-stat">
        <span className="quiz-stat-num">🔥 {streak}</span>
        <span className="quiz-stat-label">Tage-Streak</span>
      </span>
      <span className="quiz-stat">
        <span className="quiz-stat-num">{today}</span>
        <span className="quiz-stat-label">heute richtig</span>
      </span>
      <span className="quiz-stat">
        <span className="quiz-stat-num">{yesterday}</span>
        <span className="quiz-stat-label">gestern richtig</span>
      </span>
    </div>
  )
}
