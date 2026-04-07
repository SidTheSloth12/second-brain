import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { buildNoteLinkResolver, resolveNoteLinkTarget } from '../../lib/noteLinkResolve'
import type { NoteListItem } from '../../types/note'

const WIKI_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g

type Props = {
  content: string
  notesIndex: NoteListItem[]
}

export function WikiContent({ content, notesIndex }: Props) {
  const resolver = buildNoteLinkResolver(notesIndex)
  const parts: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  const re = new RegExp(WIKI_RE.source, 'g')
  while ((m = re.exec(content)) !== null) {
    if (m.index > last) {
      parts.push(<span key={`t-${last}`}>{content.slice(last, m.index)}</span>)
    }
    const target = m[1].trim()
    const label = (m[2] ?? m[1]).trim()
    const id = resolveNoteLinkTarget(target, resolver)
    const key = `l-${m.index}-${target}`
    if (id) {
      parts.push(
        <Link key={key} to={`/notes/${id}`} className="font-medium text-violet-700 underline decoration-violet-300 hover:text-violet-900">
          {label}
        </Link>
      )
    } else {
      parts.push(
        <span
          key={key}
          className="border-b border-dashed border-slate-400 text-slate-500"
          title="No note matches this link yet"
        >
          {label}
        </span>
      )
    }
    last = m.index + m[0].length
  }
  if (last < content.length) {
    parts.push(<span key={`t-${last}`}>{content.slice(last)}</span>)
  }
  return <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-200">{parts}</div>
}
