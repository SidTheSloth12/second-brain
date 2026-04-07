import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { createNote, fetchNotes, updateNote } from '../../lib/notesApi'
import { createFolder, fetchFolders, updateFolder } from '../../lib/foldersApi'
import type { NoteListItem } from '../../types/note'
import type { Folder } from '../../types/folder'
import { useState, useMemo } from 'react'
import {
  Folder as FolderIcon,
  FolderOpen,
  FileText,
  Plus,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Network
} from 'lucide-react'

export type NotesOutletContext = {
  notesIndex: NoteListItem[]
  foldersIndex: Folder[]
}

function FolderTreeItem({
  folder,
  folders,
  notes,
  onCreateNote,
  onCreateFolder,
  onMoveItem
}: {
  folder: Folder,
  folders: Folder[],
  notes: NoteListItem[],
  onCreateNote: (folderId: string) => void,
  onCreateFolder: (parentId: string) => void,
  onMoveItem: (type: 'folder' | 'note', id: string, targetFolderId: string | null) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const childFolders = folders.filter(f => f.parentId === folder.id)
  const childNotes = notes.filter(n => n.folderId === folder.id)

  const handleDragStart = (e: React.DragEvent, type: 'folder' | 'note', id: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type, id }))
    e.dataTransfer.effectAllowed = 'move'
    e.stopPropagation()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
    e.stopPropagation()
  }

  const handleDragLeave = (_e: React.DragEvent) => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const data = e.dataTransfer.getData('application/json')
    if (data) {
      try {
        const { type, id } = JSON.parse(data)
        if (type === 'folder' && id === folder.id) return
        onMoveItem(type as 'folder' | 'note', id, folder.id)
      } catch (err) {}
    }
  }

  return (
    <div className="pl-3">
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, 'folder', folder.id)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm ${
          isDragOver
            ? 'bg-violet-100 ring-2 ring-violet-400 dark:bg-violet-900/40 dark:ring-violet-500'
            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {isOpen ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
          {isOpen ? <FolderOpen size={16} className="shrink-0 text-violet-500" /> : <FolderIcon size={16} className="shrink-0 text-violet-500" />}
          <span className="truncate select-none">{folder.name}</span>
        </div>
        <div className="hidden items-center gap-1 group-hover:flex">
          <button
            onClick={(e) => { e.stopPropagation(); onCreateNote(folder.id); setIsOpen(true) }}
            className="text-slate-400 hover:text-violet-600 dark:hover:text-violet-400"
            title="New Note Here"
          ><Plus size={14} /></button>
          <button
            onClick={(e) => { e.stopPropagation(); onCreateFolder(folder.id); setIsOpen(true) }}
            className="text-slate-400 hover:text-violet-600 dark:hover:text-violet-400"
            title="New Folder Here"
          ><FolderPlus size={14} /></button>
        </div>
      </div>
      {isOpen && (
        <div className="ml-2 border-l border-slate-200 dark:border-slate-700">
          {childFolders.map(child => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              folders={folders}
              notes={notes}
              onCreateNote={onCreateNote}
              onCreateFolder={onCreateFolder}
              onMoveItem={onMoveItem}
            />
          ))}
          {childNotes.map(note => (
            <div
              key={note.id}
              draggable
              onDragStart={(e) => handleDragStart(e, 'note', note.id)}
            >
              <NavLink
                to={`/notes/${note.id}`}
                className={({ isActive }) =>
                  `group flex items-center gap-2 rounded-md px-2 py-1.5 pl-5 text-sm select-none ${
                    isActive
                      ? 'bg-violet-100 font-medium text-violet-900 dark:bg-violet-900/40 dark:text-violet-200'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`
                }
                title={note.title}
              >
                <FileText size={14} className="shrink-0 text-slate-400" />
                <span className="truncate">{note.title}</span>
              </NavLink>
            </div>
          ))}
          {childFolders.length === 0 && childNotes.length === 0 && (
            <div className="pl-6 py-1 text-xs text-slate-400 italic">Empty</div>
          )}
        </div>
      )}
    </div>
  )
}

export function NotesLayout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [folderModalOpen, setFolderModalOpen] = useState(false)
  const [modalParentId, setModalParentId] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')

  const { data: notes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ['notes'],
    queryFn: fetchNotes,
  })

  const { data: folders = [], isLoading: isLoadingFolders } = useQuery({
    queryKey: ['folders'],
    queryFn: fetchFolders,
  })

  const isLoading = isLoadingNotes || isLoadingFolders

  const createNoteMut = useMutation({
    mutationFn: (folderId: string | null = null) => createNote({ title: 'Untitled', content: '', folderId }),
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['search'] })
      navigate(`/notes/${note.id}`, { replace: true })
    },
    onError: (error: unknown) => {
      console.error('Create note failed', error)
      alert('Could not create note. Please try again.')
    },
  })

  const createFolderMut = useMutation({
    mutationFn: ({ parentId, name }: { parentId: string | null, name: string }) => {
      return createFolder({ name, parentId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    },
  })

  const moveMut = useMutation({
    mutationFn: async ({ type, id, targetFolderId }: { type: 'note' | 'folder', id: string, targetFolderId: string | null }) => {
      if (type === 'note') {
        return updateNote(id, { folderId: targetFolderId })
      } else {
        return updateFolder(id, { parentId: targetFolderId })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['folders'] })
    }
  })

  const openFolderModal = (parentId: string | null) => {
    setModalParentId(parentId)
    setNewFolderName('')
    setFolderModalOpen(true)
  }

  const submitFolder = (e: React.FormEvent) => {
    e.preventDefault()
    if (newFolderName.trim()) {
      createFolderMut.mutate({ parentId: modalParentId, name: newFolderName.trim() })
    }
    setFolderModalOpen(false)
  }

  const rootFolders = useMemo(() => folders.filter(f => !f.parentId), [folders])
  const rootNotes = useMemo(() => notes.filter(n => !n.folderId), [notes])

  const handleRootDragOver = (e: React.DragEvent) => { e.preventDefault() }
  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const data = e.dataTransfer.getData('application/json')
    if (data) {
      try {
        const { type, id } = JSON.parse(data)
        moveMut.mutate({ type: type as 'folder' | 'note', id, targetFolderId: null })
      } catch (err) {}
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Folder creation modal */}
      {folderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={submitFolder}
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:border dark:border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">Create Folder</h3>
            <input
              autoFocus
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFolderModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newFolderName.trim() || createFolderMut.isPending}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start h-[calc(100vh-8rem)]">
        {/* Sidebar */}
        <aside
          onDragOver={handleRootDragOver}
          onDrop={handleRootDrop}
          className="w-full flex-shrink-0 flex flex-col lg:w-64 border-r border-slate-200 dark:border-slate-700 pr-4 h-full overflow-hidden"
        >
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:flex-col lg:items-stretch shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => createNoteMut.mutate(null)}
                disabled={createNoteMut.isPending}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
              >
                <Plus size={16} /> Note
              </button>
              <button
                type="button"
                onClick={() => openFolderModal(null)}
                className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                title="New Root Folder"
              >
                <FolderPlus size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <NavLink
                to="/notes/new"
                className={({ isActive }) =>
                  `flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-center text-sm font-medium ${
                    isActive
                      ? 'border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`
                }
              >
                Draft
              </NavLink>
              <NavLink
                to="/notes/graph"
                className={({ isActive }) =>
                  `flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-center text-sm font-medium ${
                    isActive
                      ? 'border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`
                }
              >
                <Network size={16} /> Graph
              </NavLink>
            </div>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto space-y-0.5 pt-2 pb-12">
            {isLoading && <p className="text-xs text-slate-500 dark:text-slate-400 pl-2">Loading…</p>}
            {!isLoading && rootFolders.length === 0 && rootNotes.length === 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 pl-2">No notes yet.</p>
            )}

            <div className="space-y-0.5 -ml-3">
              {rootFolders.map((folder) => (
                <FolderTreeItem
                  key={folder.id}
                  folder={folder}
                  folders={folders}
                  notes={notes}
                  onCreateNote={(id) => createNoteMut.mutate(id)}
                  onCreateFolder={(id) => openFolderModal(id)}
                  onMoveItem={(type, id, targetId) => moveMut.mutate({ type, id, targetFolderId: targetId })}
                />
              ))}
            </div>

            <div className="space-y-0.5 mt-2">
              {rootNotes.map((n) => (
                <div
                  key={n.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'note', id: n.id }))
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <NavLink
                    to={`/notes/${n.id}`}
                    className={({ isActive }) =>
                      `group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm select-none ${
                        isActive
                          ? 'bg-violet-100 font-medium text-violet-900 dark:bg-violet-900/40 dark:text-violet-200'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`
                    }
                    title={n.title}
                  >
                    <FileText size={14} className="shrink-0 text-slate-400" />
                    <span className="truncate">{n.title}</span>
                  </NavLink>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content area */}
        <div className="min-w-0 flex-1 h-full pb-4">
          <Outlet context={{ notesIndex: notes, foldersIndex: folders } satisfies NotesOutletContext} />
        </div>
      </div>
    </div>
  )
}
