import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { groupTasksForDisplay } from '../lib/taskGroups'
import {
  createTask,
  createTaskList,
  deleteTask,
  deleteTaskList,
  fetchTaskLists,
  fetchTasks,
  updateTask,
  updateTaskList,
} from '../lib/tasksApi'
import { useConfetti } from '../hooks/useConfetti'
import type { Task, TaskFilter, TaskPriority } from '../types/task'

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDue(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function priorityBadge(p: TaskPriority) {
  const styles: Record<TaskPriority, string> = {
    low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    high: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  }
  const labels: Record<TaskPriority, string> = { low: 'Low', medium: 'Medium', high: 'High' }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[p]}`}>{labels[p]}</span>
  )
}

const inputCls =
  'w-full text-sm rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-violet-500/50'

export function TasksPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<TaskFilter>('open')
  const [editing, setEditing] = useState<Task | null>(null)

  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDue, setNewDue] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('low')
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [newListName, setNewListName] = useState('')
  const [renameListName, setRenameListName] = useState('')

  const {
    data: lists = [],
  } = useQuery({
    queryKey: ['task-lists'],
    queryFn: fetchTaskLists,
  })

  useEffect(() => {
    if (!selectedListId && lists.length > 0) {
      setSelectedListId(lists[0].id)
    }
    if (selectedListId && !lists.some((list) => list.id === selectedListId)) {
      setSelectedListId(lists[0]?.id ?? null)
    }
  }, [lists, selectedListId])

  useEffect(() => {
    const selected = lists.find((list) => list.id === selectedListId)
    if (selected) {
      setRenameListName(selected.name)
    }
  }, [lists, selectedListId])

  const selectedList = lists.find((list) => list.id === selectedListId) ?? null

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks', filter, selectedListId],
    queryFn: () => (selectedListId ? fetchTasks(filter, selectedListId) : Promise.resolve([])),
    enabled: Boolean(selectedListId),
  })

  const groups = useMemo(() => groupTasksForDisplay(tasks), [tasks])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['task-lists'] })
    queryClient.invalidateQueries({ queryKey: ['calendar'] })
  }

  const createMut = useMutation({
    mutationFn: () => {
      if (!selectedListId) {
        throw new Error('Please select a task list before adding a task.')
      }
      return createTask({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        dueAt: newDue ? new Date(newDue).toISOString() : null,
        priority: newPriority,
        listId: selectedListId,
      })
    },
    onSuccess: () => {
      setNewTitle('')
      setNewDescription('')
      setNewDue('')
      setNewPriority('low')
      invalidate()
    },
  })

  const createListMut = useMutation({
    mutationFn: (body: { name: string }) => createTaskList(body),
    onSuccess: (list) => {
      setNewListName('')
      setSelectedListId(list.id)
      invalidate()
    },
  })

  const renameListMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateTaskList(id, { name }),
    onSuccess: () => {
      invalidate()
    },
  })

  const deleteListMut = useMutation({
    mutationFn: deleteTaskList,
    onSuccess: () => {
      setSelectedListId(null)
      invalidate()
    },
  })

  const confetti = useConfetti()

  const updateMut = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string
      patch: Parameters<typeof updateTask>[1]
    }) => updateTask(id, patch),
    onSuccess: () => {
      setEditing(null)
      invalidate()
    },
  })

  const deleteMut = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      setEditing(null)
      invalidate()
    },
  })

  async function handleToggleTaskStatus(task: Task) {
    const nextStatus = task.status === 'completed' ? 'open' : 'completed'
    try {
      await updateMut.mutateAsync({
        id: task.id,
        patch: {
          status: nextStatus,
        },
      })
      if (nextStatus === 'completed') {
        await confetti({ particleCount: 32, duration: 1200 })
      }
    } catch {
      // Error handling is already done by the mutation state.
    }
  }

  const errMsg =
    error && axios.isAxiosError(error)
      ? (error.response?.data as { error?: string })?.error
      : error
        ? 'Could not load tasks'
        : null

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    try {
      await createMut.mutateAsync()
    } catch {
      /* toast could go here */
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        
        {/* Left Sidebar */}
        <div className="w-full shrink-0 md:w-64 space-y-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Tasks</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage your tasks and collections.
            </p>
          </div>

          {errMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
              {errMsg}
            </div>
          )}

          <div className="space-y-1">
            <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Status</h2>
            {(['open', 'all', 'completed'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-100'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                }`}
              >
                {f === 'open' ? 'Active' : f === 'all' ? 'All' : 'Completed'}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Lists</h2>
            {lists.length === 0 ? (
              <p className="px-1 text-xs text-slate-500 dark:text-slate-400">No lists yet.</p>
            ) : (
              <ul className="space-y-1">
                {lists.map((list) => (
                  <li key={list.id} className="group relative pr-8">
                    <button
                      type="button"
                      onClick={() => setSelectedListId(list.id)}
                      className={`w-full block truncate text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                        list.id === selectedListId
                          ? 'bg-violet-600 font-medium text-white shadow-sm shadow-violet-500/20 dark:bg-violet-600'
                          : 'font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {list.name}
                    </button>
                    {list.id === selectedListId && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Delete this list? Only empty lists can be deleted.')) {
                            deleteListMut.mutate(list.id)
                          }
                        }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1.5 text-violet-100 opacity-60 hover:bg-violet-700 hover:opacity-100 dark:text-violet-200"
                        title="Delete list"
                      >
                        ✕
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            
            <form
              onSubmit={(e) => {
                e.preventDefault()
                createListMut.mutate({ name: newListName.trim() })
              }}
              className="pt-2"
            >
              <input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="+ Create new list"
                className="w-full rounded-lg border-2 border-transparent bg-transparent px-3 py-2 text-sm font-medium text-slate-600 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-0 transition-all dark:text-slate-300 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
              />
            </form>
          </div>
          
          {(createListMut.isError || renameListMut.isError || deleteListMut.isError) && (
            <div className="rounded-lg bg-red-50 p-2 text-xs text-red-600 dark:bg-red-900/30 dark:text-red-400">
               Action failed. Ensure the list is empty before deleting.
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="min-w-0 flex-1 space-y-6">
          {/* Header/Rename List */}
          {selectedList && (
            <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 dark:border-slate-800/60 sm:flex-row sm:items-center sm:justify-between">
              <input
                value={renameListName}
                onChange={(e) => setRenameListName(e.target.value)}
                onBlur={() => renameListMut.mutate({ id: selectedList.id, name: renameListName.trim() })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur()
                  }
                }}
                className="w-full max-w-sm rounded-lg border-transparent bg-transparent px-1 py-1 text-2xl font-semibold tracking-tight text-slate-900 hover:bg-slate-50 focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:text-slate-100 dark:hover:bg-slate-800/50 dark:focus:bg-slate-800"
              />
              <span className="shrink-0 px-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>
          )}

          {/* New Task Input */}
          {selectedList && (
            <form onSubmit={handleCreate} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow focus-within:border-violet-300 focus-within:ring-4 focus-within:ring-violet-500/10 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900/80 dark:focus-within:border-violet-500/50">
              <div className="flex gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-300 dark:text-slate-600">
                  <span className="text-xl">+</span>
                </div>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Task name"
                  className="h-10 w-full bg-transparent pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={!newTitle.trim() || createMut.isPending}
                  className="shrink-0 rounded-xl bg-violet-600 px-6 font-semibold text-white transition-opacity hover:bg-violet-700 disabled:opacity-0"
                >
                  Add
                </button>
              </div>
              
              <div className="mt-2 flex flex-wrap gap-2 pl-12 pr-4 pb-1">
                <input
                  type="datetime-local"
                  value={newDue}
                  onChange={(e) => setNewDue(e.target.value)}
                  className="cursor-pointer appearance-none rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-100 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:focus:border-violet-500/50"
                />
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                  className="cursor-pointer appearance-none rounded-xl border border-slate-200/80 bg-slate-50 py-2 pl-3 pr-8 text-xs font-medium text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-100 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:focus:border-violet-500/50"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="min-w-[150px] flex-1 rounded-xl border border-transparent bg-slate-50/50 px-3 py-2 text-xs text-slate-600 transition-all hover:bg-slate-100 focus:border-violet-500 focus:bg-slate-50 focus:outline-none dark:bg-slate-800/30 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:focus:bg-slate-800"
                />
              </div>
            </form>
          )}

          {/* Task Stream */}
          {isLoading ? (
            <div className="flex flex-col gap-3 pt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/50" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 py-24 text-center dark:border-slate-700/50 dark:bg-slate-900/20">
              <div className="mb-5 text-5xl opacity-80">📝</div>
              <p className="text-base font-semibold text-slate-700 dark:text-slate-200">Inbox Zero!</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Type a task above and press enter.</p>
            </div>
          ) : (
            <div className="space-y-8 pt-2">
              {groups.map((g) => (
                <section key={g.id}>
                  <h3 className="mb-4 text-sm font-bold tracking-wide text-slate-700 dark:text-slate-300">{g.label}</h3>
                  <ul className="space-y-2.5">
                    {g.tasks.map((task) => (
                      <li
                        key={task.id}
                        className={`group cursor-default rounded-2xl border bg-white px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all ease-in-out hover:border-slate-300 hover:shadow-md dark:bg-slate-900/80 dark:hover:border-slate-600 ${
                          g.id === 'overdue' ? 'border-amber-200 dark:border-amber-900/40' : 'border-slate-200 dark:border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={task.status === 'completed'}
                            onChange={() => void handleToggleTaskStatus(task)}
                            className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded-full border-slate-300 text-violet-600 transition-transform active:scale-90 focus:ring-violet-500 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-800 dark:focus:ring-offset-slate-900"
                            aria-label={task.status === 'completed' ? 'Mark incomplete' : 'Mark complete'}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3">
                              <span
                                className={`text-base font-semibold transition-colors ${
                                  task.status === 'completed' ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'
                                }`}
                              >
                                {task.title}
                              </span>
                              {task.priority !== 'low' && priorityBadge(task.priority)}
                            </div>
                            {task.description && (
                              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap dark:text-slate-400">{task.description}</p>
                            )}
                            {task.dueAt && (
                              <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-500">
                                <span className="opacity-70">⏱</span> {formatDue(task.dueAt)}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:flex-col">
                            <button
                              type="button"
                              onClick={() => setEditing(task)}
                              className="rounded-lg p-2 text-slate-400 transition-all hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-900/20 dark:hover:text-violet-400"
                              title="Edit task"
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('Delete this task?')) deleteMut.mutate(task.id)
                              }}
                              className="rounded-lg p-2 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
                              title="Delete task"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 backdrop-blur-sm transition-all sm:items-center dark:bg-slate-950/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-task-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 md:p-8 shadow-2xl dark:border dark:border-slate-800 dark:bg-slate-950">
            <h2 id="edit-task-title" className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Edit Task
            </h2>
            <EditTaskForm
              key={editing.id}
              task={editing}
              onCancel={() => setEditing(null)}
              onSave={async (patch) => {
                await updateMut.mutateAsync({ id: editing.id, patch })
              }}
              isPending={updateMut.isPending}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function EditTaskForm({
  task,
  onCancel,
  onSave,
  isPending,
}: {
  task: Task
  onCancel: () => void
  onSave: (patch: Parameters<typeof updateTask>[1]) => Promise<void>
  isPending: boolean
}) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [due, setDue] = useState(toDatetimeLocalValue(task.dueAt))
  const [priority, setPriority] = useState<TaskPriority>(task.priority)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    await onSave({
      title: title.trim(),
      description: description.trim() || null,
      dueAt: due ? new Date(due).toISOString() : null,
      priority,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <div>
        <label htmlFor="edit-title" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          Title
        </label>
        <input
          id="edit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`mt-1.5 ${inputCls}`}
        />
      </div>
      <div>
        <label htmlFor="edit-due" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          Due Date
        </label>
        <input
          id="edit-due"
          type="datetime-local"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className={`mt-1.5 ${inputCls}`}
        />
      </div>
      <div>
        <label htmlFor="edit-priority" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          Priority
        </label>
        <select
          id="edit-priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          className={`mt-1.5 cursor-pointer appearance-none ${inputCls}`}
          style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.75rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>
      </div>
      <div>
        <label htmlFor="edit-desc" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          Description
        </label>
        <textarea
          id="edit-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={`mt-1.5 ${inputCls}`}
        />
      </div>
      <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || !title.trim()}
          className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors disabled:opacity-50 shadow-sm"
        >
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
