import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useRef } from 'react'

type Props = {
  initialHtml: string
  onDebouncedChange: (bodyHtml: string, bodyText: string) => void
}

export function TipTapJournalEditor({ initialHtml, onDebouncedChange }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onDebouncedChangeRef = useRef(onDebouncedChange)
  useEffect(() => {
    onDebouncedChangeRef.current = onDebouncedChange
  }, [onDebouncedChange])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Write today’s entry…',
      }),
    ],
    content: initialHtml || '<p></p>',
    editorProps: {
      attributes: {
        class:
          'tiptap-journal max-w-none min-h-[16rem] rounded-b-lg border border-t-0 border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-500/25 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:italic',
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      const html = ed.getHTML()
      const text = ed.getText()
      timerRef.current = setTimeout(() => {
        onDebouncedChangeRef.current(html, text)
      }, 1000)
    },
  })

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  if (!editor) {
    return <div className="min-h-[16rem] animate-pulse rounded-b-lg border border-t-0 border-slate-200 bg-slate-50" />
  }

  return <EditorContent editor={editor} />
}
