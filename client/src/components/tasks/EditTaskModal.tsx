import React, { useState } from 'react'
import type { Task, TaskPriority } from '../../types/task'
import { Trash2 } from 'lucide-react'

const inputCls =
  'w-full text-sm rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-violet-500/50'

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EditTaskModal({
  task,
  onCancel,
  onSave,
  onDelete,
  isPending,
}: {
  task: Task
  onCancel: () => void
  onSave: (patch: Partial<Task>) => Promise<void>
  onDelete?: () => void
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

          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-xl flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors dark:text-rose-400 dark:hover:bg-rose-900/20"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            ) : <div />}
            <div className="flex items-center gap-3">
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
          </div>
        </form>
      </div>
    </div>
  )
}
