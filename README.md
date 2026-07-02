# lernseiten-ui

Geteilte UI-Engine für die Lernseiten (Algebraische Grundlagen, BWL 1,
Datenbanksysteme, Mathematische Grundlagen, Template).

Enthält die inhaltsunabhängigen, über alle Seiten identischen Bausteine –
Komponenten, Hooks, Typen **und** das Basis-CSS.

## Komponenten

- **`Quiz`** – Quiz-Engine mit 7 Fragetypen (Single-/Mehrfachauswahl, Zuordnung,
  Reihenfolge, Kategorisieren, Eingabe, Wahr/Falsch), gemischten Fragen &
  Optionen und reichem Falsch-Feedback. Fragen als Prop: `<Quiz fragen={…} />`.
- **`Flashcards`** – Karteikarten mit SM-2-Spaced-Repetition (Prop `render?`
  nutzt den Aufgaben-Renderer der App).
- **`Referenz`** – erklärter Nachschlage-Tab (Inhaltsverzeichnis + Scroll-Spy +
  aufklappbare Beispiele), renderer-agnostisch über `render`/`inhaltNode`.
- **`Moodle`** – Datei-Browser (Suche, Unter-Tabs, Inline-Vorschau für
  PDF/Bild/Video/Text/Office). Baum-Prop aus `scripts/generate-dateien.mjs`.
- **`GlobalSearch`** – Overlay-Suche (Strg/Cmd-K), lädt den Index lazy via
  `loadIndex`.
- **`Header`**, **`SiteNav`**, **`Tabs`**, **`OffeneAufgaben`**, **`MathText`**
  (Markdown-lite + KaTeX).

## Hooks & Typen

`useTheme`, `useQuizProgress`, `useHashTab`, `useTaskDeepLink`, `useDoneTracker`
sowie die Typen `QuizFrage`, `FlashCard`, `SearchItem`, `ReferenzKarte`,
`TabDef`, `DateiFile`/`DateiFolder`/`DateiTyp` u. a. Siehe `src/index.ts` für
die vollständige Export-Liste.

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

Das **Basis-CSS** (Reset, Theme-Variablen, Header, Tabs, Karten, Badges,
Toggle-Buttons, komplette Quiz-Engine-Styles, `:focus-visible`) liefert das
Paket über `lernseiten-ui/styles.css`. Die App importiert es in `main.tsx`
**vor** der eigenen `index.css`:

```tsx
import 'lernseiten-ui/styles.css'
import './index.css'
```

## Engine ändern

Im Paket editieren → `npm run build` → committen/pushen → in den Apps
`npm update lernseiten-ui`. Das Paket baut beim `npm install` automatisch
(`prepare` → `tsc`). React Doctor läuft auch hier (Workflow + `doctor`-Script).
