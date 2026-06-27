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

export function Moodle({ tree, baseUrl = '', intro }: { tree: DateiFolder; baseUrl?: string; intro?: string }) {
  useEffect(() => { injectCss() }, [])
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<string>(() => tree.folders[0]?.path ?? '')
  const q = query.trim().toLowerCase()

  const allFiles = useMemo(() => collectAllFiles(tree, []), [tree])
  const pinned = useMemo(() => tree.files.filter(f => !f.isReadme), [tree])
  const results = q ? allFiles.filter(r => r.file.name.toLowerCase().includes(q)) : []
  const activeFolder = tree.folders.find(f => f.path === active)

  return (
    <div>
      <div className="section-header">
        <h2>Moodle</h2>
        <p>{intro ?? 'Alle Materialien von Moodle – nach Kategorie. Klappe eine Datei auf, um sie direkt anzusehen.'}</p>
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
      ) : (
        <>
          {tree.folders.length > 1 && (
            <div className="filter-row dz-subtabs">
              {tree.folders.map(f => (
                <button
                  type="button"
                  key={f.path}
                  className={`filter-btn${active === f.path ? ' on' : ''}`}
                  onClick={() => setActive(f.path)}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}
          {activeFolder && (
            <section className="dz-section">
              <h3 className="dz-folder-title dz-folder-title--extra">
                {cap(activeFolder.name)}
                <span className="dz-folder-count">{countFiles(activeFolder)}</span>
              </h3>
              <FolderContent folder={activeFolder} baseUrl={baseUrl} />
            </section>
          )}
        </>
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
`

function injectCss() {
  if (typeof document === 'undefined') return
  if (document.getElementById('lernseiten-moodle-css')) return
  const s = document.createElement('style')
  s.id = 'lernseiten-moodle-css'
  s.textContent = MOODLE_CSS
  document.head.appendChild(s)
}
