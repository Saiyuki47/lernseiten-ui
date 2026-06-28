import React, { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

// Markdown-lite + LaTeX-Renderer (geteilt). Erkennt `$…$` (KaTeX inline),
// `**fett**` (bzw. eine Zeile nur aus `**…**` = Zwischenüberschrift), Zeilen-
// umbrüche und Markdown-Tabellen. Wird von Algebraische & Mathe (Referenz,
// Übungsblätter, …) genutzt.

function KatexSpan({ tex }: { tex: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (ref.current) {
      katex.render(tex, ref.current, { throwOnError: false, displayMode: false })
    }
  }, [tex])
  return <span ref={ref} />
}

// A line that is entirely one bold span (e.g. "**Worum geht es?**") is treated
// as a block subheading. Returns the inner text without the ** markers, or null.
const SUBHEAD_RE = /^\*\*([^*]+)\*\*$/

function parseLine(line: string): React.ReactNode[] {
  const parts = line.split(/(\$[^$]+\$|\*\*[^*]+\*\*)/g)
  let m = 0, b = 0, t = 0
  return parts.map((part) => {
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      return <KatexSpan key={`m${m++}`} tex={part.slice(1, -1)} />
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={`b${b++}`}>{part.slice(2, -2)}</strong>
    }
    return <span key={`t${t++}`}>{part}</span>
  })
}

// Parse a pipe-delimited row into trimmed cell strings, ignoring leading/trailing pipes
function parseTableRow(line: string): string[] {
  return line.replace(/^\||\|$/g, '').split('|').map(c => c.trim())
}

function isTableRow(line: string): boolean {
  return line.trim().startsWith('|') && line.trim().endsWith('|')
}

// A separator row like |---|---| marks the header border — we skip it in output
function isSeparatorRow(line: string): boolean {
  return isTableRow(line) && /^\|[\s|:-]+\|$/.test(line.trim())
}

interface Props {
  children: string
  className?: string
  /** Render as a block (pre-like, preserving newlines with line breaks) */
  block?: boolean
}

export function MathText({ children, className, block }: Props) {
  const rawLines = children.split('\n')

  if (!block) {
    return (
      <span className={className}>
        {rawLines.map((line, li) => (
          <React.Fragment key={li}>
            {li > 0 && <br />}
            {parseLine(line)}
          </React.Fragment>
        ))}
      </span>
    )
  }

  // Group lines into segments: table segments and text segments
  type Segment =
    | { kind: 'text'; lines: string[] }
    | { kind: 'table'; rows: string[][]; hasHeader: boolean }

  const segments: Segment[] = []
  let i = 0

  while (i < rawLines.length) {
    const line = rawLines[i]
    if (isTableRow(line) && !isSeparatorRow(line)) {
      const tableLines: string[] = []
      while (i < rawLines.length && isTableRow(rawLines[i])) {
        tableLines.push(rawLines[i])
        i++
      }
      // Check if second row is a separator (markdown header separator)
      let hasHeader = false
      const rows: string[][] = []
      for (let j = 0; j < tableLines.length; j++) {
        if (j === 1 && isSeparatorRow(tableLines[j])) {
          hasHeader = true
          continue
        }
        rows.push(parseTableRow(tableLines[j]))
      }
      if (rows.length > 0) segments.push({ kind: 'table', rows, hasHeader })
    } else {
      const textLines: string[] = []
      while (i < rawLines.length && !isTableRow(rawLines[i])) {
        textLines.push(rawLines[i])
        i++
      }
      segments.push({ kind: 'text', lines: textLines })
    }
  }

  return (
    <div className={`math-block${className ? ' ' + className : ''}`}>
      {segments.map((seg, si) => {
        if (seg.kind === 'table') {
          return (
            <table key={si} className="math-table">
              <tbody>
                {seg.rows.map((row, ri) => (
                  <tr key={ri} className={seg.hasHeader && ri === 0 ? 'math-table-header' : ''}>
                    {row.map((cell, ci) => {
                      const Tag = (seg.hasHeader && ri === 0) || ci === 0 ? 'th' : 'td'
                      return (
                        <Tag key={ci}>
                          {parseLine(cell)}
                        </Tag>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
        // text segment
        return (
          <React.Fragment key={si}>
            {seg.lines.map((line, li) => {
              const head = line.match(SUBHEAD_RE)
              if (head) {
                // Block-level heading: no surrounding <br> needed (the div breaks the line)
                return (
                  <div key={li} className="math-subhead">
                    {parseLine(head[1])}
                  </div>
                )
              }
              // A blank line right before a heading is redundant — the heading's
              // own top margin already provides the spacing.
              if (line === '' && SUBHEAD_RE.test(seg.lines[li + 1] ?? '')) {
                return null
              }
              const prevHead = li > 0 && SUBHEAD_RE.test(seg.lines[li - 1])
              return (
                <React.Fragment key={li}>
                  {(si > 0 || li > 0) && !prevHead && <br />}
                  {parseLine(line)}
                </React.Fragment>
              )
            })}
          </React.Fragment>
        )
      })}
    </div>
  )
}
