import { Fragment, useState, useEffect, useMemo, type ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Geteilter "Moodle"-Datei-Browser (Stil von Datenbanksysteme): Suchleiste über
// alle Dateien, Unter-Tabs je Top-Level-Ordner, jede Datei per ▶ aufklappbar mit
// Inline-Vorschau (PDF / Bild / Video / Text / Office). Daten kommen als Prop
// (`tree`), die jede Lernseite per Generator aus ihren public/-Dateien erzeugt.
// `baseUrl` = import.meta.env.BASE_URL der App (für korrekte Pfade auf Pages).
// ---------------------------------------------------------------------------

export type DateiTyp = 'pdf' | 'image' | 'video' | 'office' | 'archive' | 'text' | 'link' | 'other'

export interface DateiFile {
  name: string
  path: string
  typ: DateiTyp
  ext: string
  sizeLabel: string
  text?: string
  url?: string
  isReadme?: boolean
  tooLarge?: boolean
}

export interface DateiFolder {
  name: string
  path: string
  folders: DateiFolder[]
  files: DateiFile[]
}

const OFFICE_VIEWER_EXT = new Set(['pptx', 'ppt', 'docx', 'doc', 'xlsx', 'xls'])

const TYPE_LABEL: Record<DateiTyp, string> = {
  pdf: 'PDF', image: 'Bild', video: 'Video', office: 'Office',
  archive: 'Archiv', text: 'Text', link: 'Link', other: 'Datei',
}

// encodeURI (nicht encodeURIComponent): kodiert Leerzeichen/Umlaute, lässt
// pfadsichere Zeichen (/ , ( )) roh – sonst findet Vites Dev-Server die Datei nicht.
const fileUrl = (baseUrl: string, path: string) => baseUrl + encodeURI(path)

function isLocalHost(): boolean {
  const h = window.location.hostname
  return (
    h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0' || h === '[::1]' ||
    h.endsWith('.local') || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)
  )
}

function officeViewerSrc(baseUrl: string, path: string): string {
  const absolute = new URL(fileUrl(baseUrl, path), window.location.href).href
  return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(absolute)}`
}

// Macht http(s)-URLs im Text klickbar. Key = Zeichen-Offset (stabil, eindeutig).
function linkify(text: string): ReactNode[] {
  const parts = text.split(/(https?:\/\/[^\s)]+)/g)
  let offset = 0
  return parts.map(part => {
    const key = `${offset}:${part}`
    offset += part.length
    return /^https?:\/\//.test(part) ? (
      <a key={key} href={part} target="_blank" rel="noopener noreferrer" className="dz-inline-link">{part}</a>
    ) : (
      <Fragment key={key}>{part}</Fragment>
    )
  })
}

function countFiles(folder: DateiFolder): number {
  return folder.files.length + folder.folders.reduce((n, f) => n + countFiles(f), 0)
}

function ReadmeNote({ file }: { file: DateiFile }) {
  return (
    <div className="dz-readme">
      <div className="dz-readme-head">
        <span className="dz-readme-icon">ℹ️</span>
        <span className="dz-readme-name">{file.name}</span>
      </div>
      {file.text && <div className="dz-readme-body">{linkify(file.text)}</div>}
    </div>
  )
}

function FilePreview({ file, baseUrl }: { file: DateiFile; baseUrl: string }) {
  const url = fileUrl(baseUrl, file.path)
  if (file.typ === 'pdf') {
    return <iframe className="dz-pdf" src={url} title={file.name} sandbox="allow-same-origin allow-popups allow-downloads" />
  }
  if (file.typ === 'image') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img className="dz-img" src={url} alt={file.name} loading="lazy" />
      </a>
    )
  }
  if (file.typ === 'video') {
    // eslint-disable-next-line react-doctor/media-has-caption -- hochgeladene Vorlesungsvideos ohne verfügbare Untertiteldatei
    return <video className="dz-video" src={url} controls preload="metadata" aria-label={file.name} />
  }
  if (file.typ === 'text' && file.text != null) {
    return <pre className="dz-text">{linkify(file.text)}</pre>
  }
  if (file.typ === 'office' && OFFICE_VIEWER_EXT.has(file.ext)) {
    if (isLocalHost()) {
      return (
        <div className="dz-office-note">
          Die Office-Vorschau funktioniert nur auf der veröffentlichten Seite (z.&nbsp;B. GitHub Pages),
          nicht lokal – Microsofts Viewer muss die Datei über eine öffentliche URL erreichen. Lade die
          Datei herunter oder öffne die veröffentlichte Seite.
        </div>
      )
    }
    return (
      <iframe
        className="dz-office"
        src={officeViewerSrc(baseUrl, file.path)}
        title={file.name}
        // eslint-disable-next-line react-doctor/iframe-missing-sandbox -- MS Office Online Viewer: braucht allow-scripts + allow-same-origin für seine EIGENE Origin (officeapps.live.com), erreicht unsere Origin nie
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        allowFullScreen
      />
    )
  }
  return null
}

function FileRow({ file, baseUrl }: { file: DateiFile; baseUrl: string }) {
  const [open, setOpen] = useState(false)
  const url = fileUrl(baseUrl, file.path)
  const officeViewable = file.typ === 'office' && OFFICE_VIEWER_EXT.has(file.ext)
  const previewable =
    file.typ === 'pdf' || file.typ === 'image' || file.typ === 'video' ||
    (file.typ === 'text' && file.text != null) || officeViewable

  if (file.typ === 'link' && file.url) {
    return (
      <div className="dz-file dz-file--link">
        <span className="dz-badge dz-badge--link">Link</span>
        <span className="dz-file-name">{file.name}</span>
        <a href={file.url} target="_blank" rel="noopener noreferrer" className="dz-action">{file.url} ↗</a>
      </div>
    )
  }

  return (
    <div className="dz-file">
      <div className="dz-file-head">
        <span className={`dz-badge dz-badge--${file.typ}`}>{file.ext.toUpperCase() || TYPE_LABEL[file.typ]}</span>
        {previewable ? (
          <button type="button" className="dz-file-toggle" onClick={() => setOpen(o => !o)}>
            <span className="dz-arrow">{open ? '▼' : '▶'}</span>
            <span className="dz-file-name">{file.name}</span>
          </button>
        ) : (
          <span className="dz-file-name dz-file-name--static">{file.name}</span>
        )}
        <span className="dz-size">{file.sizeLabel}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="dz-action"
          download={file.typ === 'office' || file.typ === 'archive' ? file.name : undefined}
        >
          {file.typ === 'office' || file.typ === 'archive' ? 'Herunterladen ↓' : 'Öffnen ↗'}
        </a>
      </div>
      {previewable && open && <FilePreview file={file} baseUrl={baseUrl} />}
    </div>
  )
}

function FolderContent({ folder, baseUrl }: { folder: DateiFolder; baseUrl: string }) {
  const readmes = folder.files.filter(f => f.isReadme)
  const files = folder.files.filter(f => !f.isReadme)
  return (
    <div className="dz-content">
      {readmes.map(r => <ReadmeNote key={r.path} file={r} />)}
      {files.map(f => <FileRow key={f.path} file={f} baseUrl={baseUrl} />)}
      {folder.folders.map(sub => (
        <div className="dz-subfolder" key={sub.path}>
          <h4 className="dz-subfolder-title">
            <span className="dz-folder-icon">📁</span>
            {sub.name}
            <span className="dz-folder-count">{countFiles(sub)}</span>
          </h4>
          <FolderContent folder={sub} baseUrl={baseUrl} />
        </div>
      ))}
    </div>
  )
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

interface FileHit { file: DateiFile; trail: string[] }
function collectAllFiles(folder: DateiFolder, trail: string[]): FileHit[] {
  const out: FileHit[] = []
  for (const f of folder.files) if (!f.isReadme) out.push({ file: f, trail })
  for (const sub of folder.folders) out.push(...collectAllFiles(sub, [...trail, cap(sub.name)]))
  return out
}

// ---------------------------------------------------------------------------
// Kategorie-Übersicht (Kachel-Design). Jeder Top-Level-Ordner wird zu einer
// Karte mit Icon, hübschem Namen, Typ-Etikett (farbcodiert) und Datei-Zähler.
// Der Typ wird aus dem Ordnernamen erraten; der Anzeigename kann per `labels`
// (Ordner-Pfad → Text) überschrieben werden, sonst wird der Rohname aufgehübscht.
// ---------------------------------------------------------------------------

type CatType = 'material' | 'uebung' | 'loesung' | 'klausur' | 'sonstiges'

const CAT_STYLE: Record<CatType, { color: string; dim: string; emoji: string; tag: string }> = {
  material:  { color: 'var(--blue)',  dim: 'var(--blue-dim)',  emoji: '📘', tag: 'Material' },
  uebung:    { color: 'var(--green)', dim: 'var(--green-dim)', emoji: '✏️', tag: 'Übung' },
  loesung:   { color: 'var(--amber)', dim: 'var(--amber-dim)', emoji: '✅', tag: 'Lösung' },
  klausur:   { color: 'var(--red)',   dim: 'var(--red-dim)',   emoji: '🎓', tag: 'Klausur' },
  sonstiges: { color: 'var(--text2)', dim: 'var(--bg3)',       emoji: '📁', tag: 'Sonstiges' },
}

// Reihenfolge der Gruppen: erst offizielles Lernmaterial, dann Üben, dann
// Prüfungsvorbereitung, Persönliches/Sonstiges zuletzt.
const CAT_ORDER: CatType[] = ['material', 'uebung', 'loesung', 'klausur', 'sonstiges']

const DEFAULT_GROUP_TITLES: Record<CatType, string> = {
  material: 'Vorlesung & Material',
  uebung: 'Übungen',
  loesung: 'Lösungen',
  klausur: 'Klausuren',
  sonstiges: 'Weitere Unterlagen',
}

// Rät den Kategorie-Typ aus dem Ordnernamen (Reihenfolge = Priorität).
function categoryType(name: string): CatType {
  const n = name.toLowerCase()
  if (/klausur|pr[üu]fung|exam|probeklausur/.test(n)) return 'klausur'
  if (/l[öo]sung|lsg|solution/.test(n)) return 'loesung'
  if (/[üu]bung|aufgabe|training|trainier|blatt/.test(n)) return 'uebung'
  if (/orga|readme|verschieden|unofficial|stuff|sonstig|unterlagen|mitschrift/.test(n)) return 'sonstiges'
  return 'material'
}

// Rohen Ordnernamen lesbar machen: Datums-Anhängsel (…-20260621) weg,
// Bindestriche/Unterstriche → Leerzeichen, ersten Buchstaben groß.
function prettify(raw: string): string {
  const s = raw.replace(/[-_ ]+20\d{6}.*$/i, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Kompakte Typ-Zusammenfassung („PDF · Bild") der Dateien im (Unter-)Baum.
function typeSummary(folder: DateiFolder): string {
  const seen = new Set<DateiTyp>()
  const walk = (f: DateiFolder) => {
    for (const x of f.files) if (!x.isReadme) seen.add(x.typ)
    for (const s of f.folders) walk(s)
  }
  walk(folder)
  const order: DateiTyp[] = ['pdf', 'image', 'video', 'office', 'text', 'archive', 'link', 'other']
  return order.filter(t => seen.has(t)).map(t => TYPE_LABEL[t]).slice(0, 3).join(' · ')
}

function metaLine(folder: DateiFolder): string {
  const total = countFiles(folder)
  const subs = folder.folders.length
  const parts = [`${total} ${total === 1 ? 'Datei' : 'Dateien'}`]
  if (subs > 0) parts.push(`${subs} ${subs === 1 ? 'Ordner' : 'Ordner'}`)
  const types = typeSummary(folder)
  if (types) parts.push(types)
  return parts.join(' · ')
}

function CategoryCard({ folder, label, onOpen }: { folder: DateiFolder; label: string; onOpen: () => void }) {
  const style = CAT_STYLE[categoryType(folder.name)]
  return (
    <button type="button" className="dz-card" onClick={onOpen}>
      <span className="dz-card-icon" style={{ color: style.color, background: style.dim }} aria-hidden="true">{style.emoji}</span>
      <span className="dz-card-name">{label}</span>
      <span className="dz-card-tag" style={{ color: style.color, background: style.dim }}>{style.tag}</span>
      <span className="dz-card-meta">{metaLine(folder)}</span>
    </button>
  )
}

interface SortedFolder { folder: DateiFolder; label: string; type: CatType }

// Sortiert die Ordner: erst nach Gruppentyp (CAT_ORDER), dann nach der optional
// vorgegebenen `order`-Liste (Ordnerpfade), zuletzt alphabetisch.
function sortFolders(folders: DateiFolder[], labelFor: (f: DateiFolder) => string, order?: string[]): SortedFolder[] {
  const rank = (p: string) => {
    const i = order ? order.indexOf(p) : -1
    return i === -1 ? Number.MAX_SAFE_INTEGER : i
  }
  return folders
    .map(f => ({ folder: f, label: labelFor(f), type: categoryType(f.name) }))
    .sort((a, b) => {
      const t = CAT_ORDER.indexOf(a.type) - CAT_ORDER.indexOf(b.type)
      if (t !== 0) return t
      const r = rank(a.folder.path) - rank(b.folder.path)
      if (r !== 0) return r
      return a.label.localeCompare(b.label, 'de')
    })
}

export function Moodle({ tree, baseUrl = '', intro, labels, order, groupTitles, grouped }: { tree: DateiFolder; baseUrl?: string; intro?: string; labels?: Record<string, string>; order?: string[]; groupTitles?: Partial<Record<CatType, string>>; grouped?: boolean }) {
  useEffect(() => { injectCss() }, [])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const q = query.trim().toLowerCase()

  const allFiles = useMemo(() => collectAllFiles(tree, []), [tree])
  const pinned = useMemo(() => tree.files.filter(f => !f.isReadme), [tree])
  const results = q ? allFiles.filter(r => r.file.name.toLowerCase().includes(q)) : []
  const openFolder = open ? tree.folders.find(f => f.path === open) : undefined
  const labelFor = (f: DateiFolder) => labels?.[f.path] ?? prettify(f.name)

  const sorted = useMemo(
    () => sortFolders(tree.folders, f => labels?.[f.path] ?? prettify(f.name), order),
    [tree, labels, order],
  )
  // Bei wenigen Kacheln (z. B. Algebra: Folien/Übungen/Lösungen) wären Überschriften
  // mehr Ballast als Hilfe – dann flach, nur sortiert.
  const showGroups = grouped ?? tree.folders.length > 4
  const groups = useMemo(() => {
    // In einem Durchlauf über CAT_ORDER die nicht-leeren Gruppen sammeln
    // (statt .map().filter(), das zweimal iterieren würde).
    const out: { type: CatType; title: string; items: SortedFolder[] }[] = []
    for (const t of CAT_ORDER) {
      const items = sorted.filter(s => s.type === t)
      if (items.length > 0) out.push({ type: t, title: groupTitles?.[t] ?? DEFAULT_GROUP_TITLES[t], items })
    }
    return out
  }, [sorted, groupTitles])

  return (
    <div>
      <div className="section-header">
        <h2>Moodle</h2>
        <p>{intro ?? 'Alle Materialien von Moodle – nach Kategorie. Wähle eine Kachel, um ihre Dateien zu öffnen.'}</p>
      </div>

      {pinned.length > 0 && (
        <div className="dz-pinned">
          {pinned.map(f => <FileRow key={f.path} file={f} baseUrl={baseUrl} />)}
        </div>
      )}

      <input
        type="search"
        className="dz-search"
        aria-label="Alle Dateien durchsuchen"
        placeholder="Alle Dateien durchsuchen…"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      {q ? (
        results.length === 0 ? (
          <p className="dz-empty">Keine Dateien gefunden für „{query}".</p>
        ) : (
          <div className="dz-content">
            {results.map(({ file, trail }) => (
              <div key={file.path}>
                {trail.length > 0 && <p className="dz-crumb">{trail.join(' / ')}</p>}
                <FileRow file={file} baseUrl={baseUrl} />
              </div>
            ))}
          </div>
        )
      ) : openFolder ? (
        <section className="dz-section">
          <button type="button" className="dz-back" onClick={() => setOpen(null)}>← Alle Kategorien</button>
          <h3 className="dz-cat-title">
            <span className="dz-cat-emoji" aria-hidden="true">{CAT_STYLE[categoryType(openFolder.name)].emoji}</span>
            {labelFor(openFolder)}
            <span className="dz-folder-count">{countFiles(openFolder)}</span>
          </h3>
          <FolderContent folder={openFolder} baseUrl={baseUrl} />
        </section>
      ) : showGroups ? (
        <div>
          {groups.map(g => (
            <section className="dz-group" key={g.type}>
              <div className="dz-group-head">
                <span className="dz-group-title">{g.title}</span>
                <span className="dz-group-count">{g.items.length}</span>
                <span className="dz-group-rule" />
              </div>
              <div className="dz-cards">
                {g.items.map(({ folder, label }) => (
                  <CategoryCard key={folder.path} folder={folder} label={label} onOpen={() => setOpen(folder.path)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="dz-cards">
          {sorted.map(({ folder, label }) => (
            <CategoryCard key={folder.path} folder={folder} label={label} onOpen={() => setOpen(folder.path)} />
          ))}
        </div>
      )}
    </div>
  )
}

// Selbst-injiziertes CSS (einmalig), damit die Komponente ohne App-CSS auskommt.
// Nutzt die Theme-Variablen der Apps (var(--bg2)/--border/--text/…).
const MOODLE_CSS = `
.dz-search{width:100%;box-sizing:border-box;margin-bottom:1.25rem;padding:10px 14px;font-family:var(--font-sans);font-size:14px;color:var(--text);background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius,10px);outline:none}
.dz-search:focus{border-color:var(--blue)}
.dz-search::placeholder{color:var(--text3)}
.dz-empty{color:var(--text2);font-size:14px}
.dz-content{display:flex;flex-direction:column;gap:6px}
.dz-arrow{color:var(--text3);font-size:11px;width:12px;flex:none}
.dz-folder-icon{flex:none}
.dz-folder-count{flex:none;font-size:12px;color:var(--text2);background:var(--bg3);border-radius:999px;padding:1px 9px}
.dz-readme{background:var(--amber-dim);border:1px solid rgba(245,166,35,0.25);border-left:3px solid var(--amber);border-radius:var(--radius,10px);padding:10px 14px}
.dz-readme-head{display:flex;align-items:center;gap:8px;margin-bottom:4px}
.dz-readme-icon{flex:none}
.dz-readme-name{font-size:13px;font-weight:600;color:var(--amber)}
.dz-readme-body{font-size:13px;color:var(--text);line-height:1.7;white-space:pre-wrap}
.dz-file{border:1px solid var(--border);border-radius:var(--radius,10px);background:var(--bg);overflow:hidden}
.dz-file-head{display:flex;align-items:center;gap:10px;padding:8px 12px}
.dz-file-toggle{flex:1;display:flex;align-items:center;gap:8px;background:transparent;border:none;cursor:pointer;font-family:var(--font-sans);font-size:13.5px;color:var(--text);text-align:left;padding:0;min-width:0}
.dz-file-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dz-file-name--static{flex:1;min-width:0;font-size:13.5px}
.dz-size{flex:none;font-size:11.5px;color:var(--text3);font-family:var(--font-mono)}
.dz-action{flex:none;font-size:12px;color:var(--blue);text-decoration:none;border:1px solid var(--border);border-radius:6px;padding:3px 9px;white-space:nowrap}
.dz-action:hover{background:var(--blue-dim);border-color:rgba(77,159,255,0.3)}
.dz-file--link{display:flex;align-items:center;gap:10px;padding:8px 12px;flex-wrap:wrap}
.dz-file--link .dz-action{border:none;padding:0;overflow:hidden;text-overflow:ellipsis}
.dz-badge{flex:none;font-size:10px;font-weight:600;letter-spacing:0.04em;font-family:var(--font-mono);border-radius:5px;padding:2px 6px;color:var(--text2);background:var(--bg3);min-width:34px;text-align:center}
.dz-badge--pdf{color:var(--red);background:var(--red-dim)}
.dz-badge--image{color:var(--green);background:var(--green-dim)}
.dz-badge--video{color:var(--amber);background:var(--amber-dim)}
.dz-badge--text{color:var(--blue);background:var(--blue-dim)}
.dz-badge--link{color:var(--blue);background:var(--blue-dim)}
.dz-pdf{width:100%;height:640px;border:none;border-top:1px solid var(--border);background:var(--bg2);display:block}
.dz-img{display:block;max-width:100%;height:auto;border-top:1px solid var(--border)}
.dz-video{display:block;width:100%;max-height:640px;background:#000;border-top:1px solid var(--border)}
.dz-text{margin:0;border-top:1px solid var(--border);padding:1rem 1.25rem;font-family:var(--font-mono);font-size:12.5px;line-height:1.7;color:var(--text);background:var(--bg2);white-space:pre-wrap;word-break:break-word;max-height:640px;overflow:auto}
.dz-inline-link{color:var(--blue)}
.dz-office{width:100%;height:600px;border:none;border-top:1px solid var(--border);background:var(--bg2);display:block}
.dz-office-note{border-top:1px solid var(--border);padding:12px 14px;font-size:12.5px;line-height:1.7;color:var(--text2);background:var(--bg3)}
.dz-pinned{margin-bottom:1.25rem}
.dz-subtabs{margin-top:1.25rem;margin-bottom:1.5rem}
.dz-section{display:flex;flex-direction:column}
.dz-folder-title{display:flex;align-items:center;gap:9px;font-size:16px;font-weight:600;color:var(--text);margin:0 0 12px;padding-bottom:9px;border-bottom:1px solid var(--border)}
.dz-folder-title::before{content:'';flex:none;width:4px;height:18px;border-radius:2px;background:var(--text3)}
.dz-folder-title--extra::before{background:var(--amber)}
.dz-folder-title .dz-folder-count,.dz-subfolder-title .dz-folder-count{margin-left:auto}
.dz-subfolder{display:flex;flex-direction:column;gap:6px;margin:6px 0 2px;padding-left:12px;border-left:2px solid var(--border)}
.dz-subfolder-title{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--text2);margin:2px 0}
.dz-crumb{font-size:11.5px;color:var(--text3);font-family:var(--font-mono);margin:10px 0 3px}
.dz-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;margin-top:1.25rem}
.dz-group{display:block;margin-top:1.75rem}
.dz-group:first-child{margin-top:1.25rem}
.dz-group .dz-cards{margin-top:0}
.dz-group-head{display:flex;align-items:center;gap:10px;margin:0 0 11px}
.dz-group-title{font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:var(--text2);white-space:nowrap}
.dz-group-count{flex:none;font-size:11px;color:var(--text3);background:var(--bg3);border-radius:999px;padding:1px 8px}
.dz-group-rule{flex:1;height:1px;background:var(--border)}
.dz-card{display:flex;flex-direction:column;align-items:flex-start;gap:9px;text-align:left;padding:14px 15px;border:1px solid var(--border);border-radius:14px;background:var(--bg);cursor:pointer;font-family:var(--font-sans);color:var(--text);transition:border-color .12s ease,transform .12s ease}
.dz-card:hover{border-color:var(--text3);transform:translateY(-2px)}
.dz-card:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.dz-card-icon{width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:20px}
.dz-card-name{font-size:14.5px;font-weight:600;line-height:1.3}
.dz-card-tag{font-size:10.5px;font-weight:600;letter-spacing:0.03em;border-radius:6px;padding:2px 8px}
.dz-card-meta{margin-top:2px;font-size:12px;color:var(--text2);line-height:1.5}
.dz-back{align-self:flex-start;background:transparent;border:none;cursor:pointer;font-family:var(--font-sans);font-size:13px;color:var(--blue);padding:0;margin-bottom:14px}
.dz-back:hover{text-decoration:underline}
.dz-cat-title{display:flex;align-items:center;gap:10px;font-size:17px;font-weight:600;color:var(--text);margin:0 0 14px;padding-bottom:10px;border-bottom:1px solid var(--border)}
.dz-cat-emoji{flex:none;font-size:20px}
.dz-cat-title .dz-folder-count{margin-left:auto}
`

function injectCss() {
  if (typeof document === 'undefined') return
  if (document.getElementById('lernseiten-moodle-css')) return
  const s = document.createElement('style')
  s.id = 'lernseiten-moodle-css'
  s.textContent = MOODLE_CSS
  document.head.appendChild(s)
}
