# lernseiten-ui

Geteilte UI-Engine für die Lernseiten (Algebraische Grundlagen, BWL 1,
Datenbanksysteme, Mathematische Grundlagen, Template).

Enthält die inhaltsunabhängigen, über alle Seiten identischen Bausteine:

- **`Quiz`** – Quiz-Engine mit 7 Fragetypen (Single-/Mehrfachauswahl, Zuordnung,
  Reihenfolge, Kategorisieren, Eingabe, Wahr/Falsch), gemischten Fragen &
  Optionen und reichem Falsch-Feedback. Die Fragen kommen als Prop:
  `<Quiz fragen={quizFragen} />`.
- **`useTheme`** – Dark/Light-Umschaltung (localStorage).
- **`useQuizProgress`** – Fortschritt (globaler Streak + fachspezifische
  Tageszähler).
- Quiz-Typen (`QuizFrage` etc.).

## Verwendung

In einer App als Git-Dependency einbinden:

```jsonc
// package.json der App
"dependencies": {
  "lernseiten-ui": "github:Saiyuki47/lernseiten-ui"
}
```

```tsx
import { Quiz, useTheme } from 'lernseiten-ui'
import type { QuizFrage } from 'lernseiten-ui'
import { quizFragen } from './data/quiz'

// ...
<Quiz fragen={quizFragen} />
```

Die **CSS-Klassen** (z.B. `.opt-btn`, `.quiz-feedback-box`, `.tipp-section`)
liefert weiterhin die jeweilige App in ihrer `index.css` – sie sind über alle
Seiten identisch. (Kann später ebenfalls ins Paket wandern.)

Das Paket wird beim `npm install` automatisch gebaut (`prepare` → `tsc`).
