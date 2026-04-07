import { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CodeMirror from '@uiw/react-codemirror'
import { EditorView, Decoration, ViewPlugin } from '@codemirror/view'
import type { DecorationSet, ViewUpdate } from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'
import { buildNoteLinkResolver, resolveNoteLinkTarget } from '../../lib/noteLinkResolve'
import type { NoteListItem } from '../../types/note'
import { markdown } from '@codemirror/lang-markdown'

const WIKI_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g

type Props = {
  content: string
  onChange: (value: string) => void
  notesIndex: NoteListItem[]
}

const hiddenBracketDeco = Decoration.replace({})

const linkTextMark = (targetId: string) =>
  Decoration.mark({
    class: 'cm-wiki-link font-medium text-violet-700 underline decoration-violet-300 hover:text-violet-900 cursor-pointer',
    attributes: { 'data-target-id': targetId },
  })

const deadLinkTextMark = Decoration.mark({
  class: 'border-b border-dashed border-slate-400 text-slate-500',
  attributes: { title: 'No note matches this link yet' },
})

export function LivePreviewEditor({ content, onChange, notesIndex }: Props) {
  const navigate = useNavigate()
  
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains('dark')
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const extensions = useMemo(() => {
    const resolver = buildNoteLinkResolver(notesIndex)

    function buildDecorations(view: EditorView) {
      const builder = new RangeSetBuilder<Decoration>()
      const selection = view.state.selection.main

      for (const { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to)
        let match
        const re = new RegExp(WIKI_RE.source, 'g')

        while ((match = re.exec(text)) !== null) {
          const matchStart = from + match.index
          const matchEnd = matchStart + match[0].length

          const target = match[1].trim()

          // If the cursor is anywhere on or inside the link, we do NOT collapse it.
          const isFocused = selection.to >= matchStart && selection.from <= matchEnd

          if (!isFocused) {
            const openOffset = 2 + (match[2] ? target.length + 1 : 0)
            const openBracketEnd = matchStart + openOffset 
            const closeBracketStart = matchEnd - 2

            const targetId = resolveNoteLinkTarget(target, resolver)

            // Hide LHS brackets and targets if any
            if (matchStart < openBracketEnd) {
              builder.add(matchStart, openBracketEnd, hiddenBracketDeco)
            }
            
            // Format the visible label
            if (openBracketEnd < closeBracketStart) {
              builder.add(
                openBracketEnd,
                closeBracketStart,
                targetId ? linkTextMark(targetId) : deadLinkTextMark
              )
            }
            
            // Hide RHS brackets
            if (closeBracketStart < matchEnd) {
              builder.add(closeBracketStart, matchEnd, hiddenBracketDeco)
            }
          }
        }
      }
      return builder.finish()
    }

    const plugin = ViewPlugin.fromClass(
      class {
        decorations: DecorationSet
        constructor(view: EditorView) {
          this.decorations = buildDecorations(view)
        }
        update(update: ViewUpdate) {
          if (update.docChanged || update.viewportChanged || update.selectionSet) {
            this.decorations = buildDecorations(update.view)
          }
        }
      },
      {
        decorations: (v) => v.decorations,
      }
    )

    const domEvents = EditorView.domEventHandlers({
      click(event) {
        const target = event.target as HTMLElement
        if (target.classList.contains('cm-wiki-link')) {
          const targetId = target.getAttribute('data-target-id')
          if (targetId) {
            navigate(`/notes/${targetId}`)
            return true
          }
        }
        return false
      },
    })

    return [markdown(), plugin, domEvents]
  }, [notesIndex, navigate])

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-900">
      <CodeMirror
        value={content}
        onChange={onChange}
        extensions={extensions}
        theme={isDark ? 'dark' : 'light'}
        className="text-sm [&_.cm-editor]:min-h-[16rem] [&_.cm-scroller]:font-mono"
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: false,
        }}
      />
    </div>
  )
}
