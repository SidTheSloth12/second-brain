import React, { useState } from 'react'
import type { TaskFilter, TaskList } from '../../types/task'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTaskList, deleteTaskList } from '../../lib/tasksApi'

export function TaskSidebar({
  filter,
  setFilter,
  lists,
  selectedListId,
  setSelectedListId,
  errMsg,
}: {
  filter: TaskFilter
  setFilter: (f: TaskFilter) => void
  lists: TaskList[]
  selectedListId: string | null
  setSelectedListId: (id: string | null) => void
  errMsg: string | null
}) {
  const queryClient = useQueryClient()
  const [newListName, setNewListName] = useState('')

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['task-lists'] })
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }

  const createListMut = useMutation({
    mutationFn: (body: { name: string }) => createTaskList(body),
    onSuccess: (list) => {
      setNewListName('')
      setSelectedListId(list.id)
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

  return (
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

      {(createListMut.isError || deleteListMut.isError) && (
        <div className="rounded-lg bg-red-50 p-2 text-xs text-red-600 dark:bg-red-900/30 dark:text-red-400">
          Action failed. Ensure the list is empty before deleting.
        </div>
      )}
    </div>
  )
}
