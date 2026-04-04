import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import axios from 'axios'
import { AppShell } from '../components/AppShell'
import { groupTasksForDisplay } from '../lib/taskGroups'
import { createTask, deleteTask, fetchTasks, updateTask } from '../lib/tasksApi'
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
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-amber-100 text-amber-800',
    high: 'bg-rose-100 text-rose-800',
  }
  const labels: Record<TaskPriority, string> = { low: 'Low', medium: 'Medium', high: 'High' }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[p]}`}>{labels[p]}</span>
  )
}

export function TasksPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<TaskFilter>('open')
  const [editing, setEditing] = useState<Task | null>(null)

  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDue, setNewDue] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium')
  const [showNewDetails, setShowNewDetails] = useState(false)

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks', filter],
    queryFn: () => fetchTasks(filter),
  })

  const groups = useMemo(() => groupTasksForDisplay(tasks), [tasks])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['calendar'] })
  }

  const createMut = useMutation({
    mutationFn: () =>
      createTask({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        dueAt: newDue ? new Date(newDue).toISOString() : null,
        priority: newPriority,
      }),
    onSuccess: () => {
      setNewTitle('')
      setNewDescription('')
      setNewDue('')
      setNewPriority('medium')
      setShowNewDetails(false)
      invalidate()
    },
  })

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
    <AppShell title="Tasks">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tasks</h1>
          <p className="mt-1 text-sm text-slate-500">
            Due dates use the same timestamps the calendar will use later.
          </p>
        </div>

        {errMsg && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errMsg}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {(['open', 'all', 'completed'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                filter === f
                  ? 'bg-violet-600 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {f === 'open' ? 'Active' : f === 'all' ? 'All' : 'Done'}
            </button>
          ))}
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">New task</h2>
          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <label htmlFor="task-title" className="sr-only">
                  Title
                </label>
                <input
                  id="task-title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
              <button
                type="submit"
                disabled={!newTitle.trim() || createMut.isPending}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {createMut.isPending ? 'Adding…' : 'Add task'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowNewDetails((v) => !v)}
              className="text-sm text-violet-600 hover:text-violet-800"
            >
              {showNewDetails ? 'Hide details' : 'Due date, priority, description'}
            </button>
            {showNewDetails && (
              <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="task-due" className="block text-xs font-medium text-slate-600">
                    Due
                  </label>
                  <input
                    id="task-due"
                    type="datetime-local"
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
                <div>
                  <label htmlFor="task-priority" className="block text-xs font-medium text-slate-600">
                    Priority
                  </label>
                  <select
                    id="task-priority"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="task-desc" className="block text-xs font-medium text-slate-600">
                    Description
                  </label>
                  <textarea
                    id="task-desc"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>
            )}
            {createMut.isError && (
              <p className="text-sm text-red-600">
                {axios.isAxiosError(createMut.error)
                  ? (createMut.error.response?.data as { error?: string })?.error ?? 'Could not create'
                  : 'Could not create'}
              </p>
            )}
          </form>
        </section>

        {isLoading ? (
          <p className="text-center text-slate-500">Loading tasks…</p>
        ) : tasks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center text-slate-500">
            No tasks yet. Add one above.
          </p>
        ) : (
          <div className="space-y-10">
            {groups.map((g) => (
              <section key={g.id}>
                <h2 className="mb-3 text-sm font-semibold text-slate-700">{g.label}</h2>
                <ul className="space-y-2">
                  {g.tasks.map((task) => (
                    <li
                      key={task.id}
                      className={`rounded-xl border bg-white px-4 py-3 shadow-sm ${
                        g.id === 'overdue' ? 'border-rose-200' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-start gap-3">
                        <input
                          type="checkbox"
                          checked={task.status === 'completed'}
                          onChange={() =>
                            updateMut.mutate({
                              id: task.id,
                              patch: {
                                status: task.status === 'completed' ? 'open' : 'completed',
                              },
                            })
                          }
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                          aria-label={task.status === 'completed' ? 'Mark incomplete' : 'Mark complete'}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`font-medium ${
                                task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'
                              }`}
                            >
                              {task.title}
                            </span>
                            {priorityBadge(task.priority)}
                          </div>
                          {task.description && (
                            <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{task.description}</p>
                          )}
                          {task.dueAt && (
                            <p className="mt-1 text-xs text-slate-500">Due {formatDue(task.dueAt)}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => setEditing(task)}
                            className="rounded-lg px-2 py-1 text-sm text-violet-600 hover:bg-violet-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Delete this task?')) deleteMut.mutate(task.id)
                            }}
                            className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
                          >
                            Delete
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

        {editing && (
          <div
            className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-task-title"
          >
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
              <h2 id="edit-task-title" className="text-lg font-semibold text-slate-900">
                Edit task
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
    </AppShell>
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
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label htmlFor="edit-title" className="block text-xs font-medium text-slate-600">
          Title
        </label>
        <input
          id="edit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        />
      </div>
      <div>
        <label htmlFor="edit-due" className="block text-xs font-medium text-slate-600">
          Due
        </label>
        <input
          id="edit-due"
          type="datetime-local"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        />
      </div>
      <div>
        <label htmlFor="edit-priority" className="block text-xs font-medium text-slate-600">
          Priority
        </label>
        <select
          id="edit-priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div>
        <label htmlFor="edit-desc" className="block text-xs font-medium text-slate-600">
          Description
        </label>
        <textarea
          id="edit-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || !title.trim()}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}
