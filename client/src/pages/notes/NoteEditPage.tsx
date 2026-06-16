import { useMutation, useQuery, useQueryClient } from'@tanstack/react-query'
import { useState } from'react'
import { Link, useNavigate, useParams, useOutletContext } from'react-router-dom'
import axios from'axios'
import { LivePreviewEditor } from'../../components/notes/LivePreviewEditor'
import { TagEditor } from'../../components/notes/TagEditor'
import {
  deleteNote,
  fetchTags,
  fetchNote,
  fetchNoteBacklinks,
  updateNote,
} from'../../lib/notesApi'
import { uploadAttachment, deleteAttachment, fetchAttachments } from'../../lib/attachmentsApi'
import { Paperclip, X, File as FileIcon } from'lucide-react'
import type { NoteDetail, NoteListItem } from'../../types/note'
import type { NotesOutletContext } from'./NotesLayout'
function NoteEditorBody({
 note,
 notesIndex,
 backlinks,
}: {
 note: NoteDetail
 notesIndex: NoteListItem[]
 backlinks: NoteListItem[]
}) {
 const queryClient=useQueryClient()
 const navigate=useNavigate()
 const [title, setTitle]=useState(note.title)
 const [content, setContent]=useState(note.content)
 const [tags, setTags]=useState(note.tags)
 const [saveError, setSaveError]=useState<string | null>(null)
 const { data: allTags=[] }=useQuery({
 queryKey: ['note-tags'],
 queryFn: fetchTags,
 })
 const dirty =
 title!==note.title ||
 content!==note.content ||
 tags.join(', ')!==note.tags.join(', ')
 const updateMut=useMutation({
 mutationFn: ()=>
 updateNote(note.id, { title: title.trim() ||'Untitled', content, tags }),
 onSuccess: ()=>{
 setSaveError(null)
 queryClient.invalidateQueries({ queryKey: ['notes'] })
 queryClient.invalidateQueries({ queryKey: ['notes', note.id] })
 queryClient.invalidateQueries({ queryKey: ['notes', note.id,'backlinks'] })
 queryClient.invalidateQueries({ queryKey: ['search'] })
 },
 onError: (e)=>{
 setSaveError(
 axios.isAxiosError(e) ? (e.response?.data as { error?:string })?.error ??'Save failed' :'Save failed'
 )
 },
 })
  const deleteMut=useMutation({
    mutationFn: ()=>deleteNote(note.id),
    onSuccess: ()=>{
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['search'] })
      navigate('/notes', { replace: true })
    },
  })
  const { data: allAttachments=[] }=useQuery({
    queryKey: ['attachments'],
    queryFn: fetchAttachments,
  })
  const noteAttachments=allAttachments.filter((a)=>a.note_id===note.id)
  const uploadMut=useMutation({
    mutationFn: (file: File)=>uploadAttachment(file, note.id),
    onSuccess: (newAttachment)=>{
      queryClient.invalidateQueries({ queryKey: ['attachments'] })
      if (newAttachment.mime_type.startsWith('image/')) {
        const md =`\n![${newAttachment.filename}](http://localhost:5000/uploads/${newAttachment.filepath})\n`
        setContent((prev)=>prev+md)
      } else {
        const md =`\n[${newAttachment.filename}](http://localhost:5000/uploads/${newAttachment.filepath})\n`
        setContent((prev)=>prev+md)
      }
    },
  })
  const deleteAttachmentMut=useMutation({
    mutationFn: deleteAttachment,
    onSuccess: ()=>{
      queryClient.invalidateQueries({ queryKey: ['attachments'] })
    },
  })
  const handleFileChange=(e: React.ChangeEvent<HTMLInputElement>)=>{
    if (e.target.files&&e.target.files[0]) {
      uploadMut.mutate(e.target.files[0])
      e.target.value =''
    }
  }
 return (
 <div className ="space-y-6">
 <div className ="flex flex-wrap items-start justify-end gap-3">
 <div className ="flex flex-wrap gap-2">
  <div className="relative inline-block">
    <input
      type="file"
      onChange={handleFileChange}
      disabled={uploadMut.isPending}
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      title="Attach File"
    />
    <button
      type="button"
      disabled={uploadMut.isPending}
      className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <Paperclip className="h-4 w-4" />
      {uploadMut.isPending ?'Uploading…' :'Attach File'}
    </button>
  </div>
  <button
  type ="button"
  disabled={!dirty||updateMut.isPending}
  onClick={()=>updateMut.mutate()}
  className ="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-40"
  >
  {updateMut.isPending ?'Saving…' :'Save'}
  </button>
 <button
 type ="button"
 onClick={()=>{
 if (confirm('Delete this note permanently?')) deleteMut.mutate()
 }}
 disabled={deleteMut.isPending}
 className ="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-700/60 dark:bg-transparent dark:text-rose-400 dark:hover:bg-rose-900/20"
 >
 Delete
 </button>
 </div>
 </div>
 {saveError&&(
 <div className ="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300" role ="alert">
 {saveError}
 </div>
 )}
 <div className ="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
 <input
 value={title}
 onChange={(e)=>setTitle(e.target.value)}
 className ="w-full border-b border-transparent bg-transparent text-xl font-semibold text-slate-900 focus:border-violet-300 focus:outline-none dark:text-slate-100"
 aria-label ="Title"
 />
 <TagEditor tags={tags} allTags={allTags} onChange={setTags}/>
 <div>
 <label className ="mb-2 block text-xs font-medium text-slate-500 dark:text-slate-400">
 Content (Live Preview) — type [[ to link notes
 </label>
 <LivePreviewEditor content={content} onChange={setContent} notesIndex={notesIndex}/>
 </div>
 </div>
 {noteAttachments.length>0&&(
  <div className="space-y-2">
    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Attachments</h3>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {noteAttachments.map((a)=>{
        const isImage=a.mime_type.startsWith('image/')
        return (
          <div key={a.id} className="group relative flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition-all hover:border-violet-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-violet-600">
            <button
              onClick={()=>{
                if (confirm('Delete this attachment?')) deleteAttachmentMut.mutate(a.id)
              }}
              className="absolute -right-2 -top-2 z-10 rounded-full bg-red-100 p-1 text-red-600 opacity-0 shadow-sm transition-all hover:scale-110 hover:bg-red-200 group-hover:opacity-100 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
              title="Delete attachment"
            >
              <X className="h-3 w-3" />
            </button>
            {isImage ? (
              <a href={`http://localhost:5000/uploads/${a.filepath}`} target="_blank" rel="noreferrer" className="w-full">
                <img src={`http://localhost:5000/uploads/${a.filepath}`} alt={a.filename} className="h-24 w-full rounded-lg object-cover" />
              </a>
            ) : (
              <a href={`http://localhost:5000/uploads/${a.filepath}`} target="_blank" rel="noreferrer" className="flex h-24 w-full items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800">
                <FileIcon className="h-8 w-8 text-slate-400" />
              </a>
            )}
            <p className="mt-2 w-full truncate text-center text-xs font-medium text-slate-600 dark:text-slate-400" title={a.filename}>{a.filename}</p>
          </div>
        )
      })}
    </div>
  </div>
 )}
 {backlinks.length>0&&(
 <section>
 <h3 className ="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Linked from</h3>
 <ul className ="space-y-1 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
 {backlinks.map((b)=>(
 <li key={b.id}>
 <Link to={`/notes/${b.id}`} className ="text-sm text-violet-700 hover:underline dark:text-violet-400">
 {b.title}
 </Link>
 </li>
 ))}
 </ul>
 </section>
 )}
 </div>
 )
}
export function NoteEditPage() {
 const { noteId }=useParams<{ noteId:string }>()
 const { notesIndex }=useOutletContext<NotesOutletContext>()
 const { data: note, isLoading, error }=useQuery({
 queryKey: ['notes', noteId],
 queryFn: ()=>fetchNote(noteId!),
 enabled: Boolean(noteId),
 })
 const { data: backlinks=[] }=useQuery({
 queryKey: ['notes', noteId,'backlinks'],
 queryFn: ()=>fetchNoteBacklinks(noteId!),
 enabled: Boolean(noteId),
 })
 if (!noteId) {
 return<p className ="text-slate-500">Missing note id.</p>
 }
 if (isLoading) {
 return<p className ="text-slate-500">Loading note…</p>
 }
 if (error||!note) {
 return (
 <div className ="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
 {axios.isAxiosError(error)
 ? (error.response?.data as { error?:string })?.error ??'Note not found'
 :'Note not found'}
 <div className ="mt-2">
 <Link to ="/notes" className ="text-violet-700 underline">
 Back to notes
 </Link>
 </div>
 </div>
 )
 }
 return (
 <NoteEditorBody key={note.id} note={note} notesIndex={notesIndex} backlinks={backlinks}/>
 )
}