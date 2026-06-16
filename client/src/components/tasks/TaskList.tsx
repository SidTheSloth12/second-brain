import React, { useMemo } from'react'
import type { Task, TaskPriority } from'../../types/task'
import { groupTasksForDisplay } from'../../lib/taskGroups'
import { Pencil, Trash2 } from'lucide-react'
function formatDue(iso:string | null):string {
  if (!iso) return''
  return new Date(iso).toLocaleString(undefined, {
    weekday:'short',
    month:'short',
    day:'numeric',
    hour:'numeric',
    minute:'2-digit',
  })
}
function priorityBadge(p: TaskPriority) {
  const styles: Record<TaskPriority,string>={
    low:'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    medium:'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    high:'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  }
  const labels: Record<TaskPriority,string>={ low:'Low', medium:'Medium', high:'High' }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[p]}`}>{labels[p]}</span>
  )
}
const TaskItem=React.memo(({
  task,
  onToggleStatus,
  onEdit,
  onDelete,
  groupId
}: {
  task: Task
  onToggleStatus: (task: Task)=>void
  onEdit: (task: Task)=>void
  onDelete: (taskId:string)=>void
  groupId:string
})=>{
  return (
    <li
      className={`group cursor-default rounded-2xl border bg-white px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all ease-in-out hover:border-slate-300 hover:shadow-md dark:bg-slate-900/80 dark:hover:border-slate-600 ${
        groupId === 'overdue' ? 'border-amber-200 dark:border-amber-900/40' : 'border-slate-200 dark:border-slate-800/80'
      }`}
    >
      <div className="flex items-start gap-4">
        <input
          type="checkbox"
          checked={task.status==='completed'}
          onChange={()=>onToggleStatus(task)}
          className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded-full border-slate-300 text-violet-600 transition-transform active:scale-90 focus:ring-violet-500 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-800 dark:focus:ring-offset-slate-900"
          aria-label={task.status==='completed' ?'Mark incomplete' :'Mark complete'}
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
            {task.priority!=='low' && priorityBadge(task.priority)}
          </div>
          {task.description&&(
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap dark:text-slate-400">{task.description}</p>
          )}
          {task.dueAt&&(
            <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-500">
              <span className="opacity-70"></span>{formatDue(task.dueAt)}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2 opacity-0 transition-opacity group-hover:opacity-100 sm:flex-col">
          <button
            type="button"
            onClick={()=>onEdit(task)}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-900/20 dark:hover:text-violet-400"
            title="Edit task"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={()=>onDelete(task.id)}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
            title="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </li>
  )
})
export function TaskList({
  tasks,
  isLoading,
  onToggleStatus,
  onEdit,
  onDelete,
  page,
  setPage,
  total,
  limit,
}: {
  tasks: Task[]
  isLoading: boolean
  onToggleStatus: (task: Task)=>void
  onEdit: (task: Task)=>void
  onDelete: (taskId:string)=>void
  page: number
  setPage: (page: number)=>void
  total: number
  limit: number
}) {
  const groups=useMemo(()=>groupTasksForDisplay(tasks), [tasks])
  const totalPages=Math.ceil(total/limit)
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 pt-4">
        {[1, 2, 3, 4].map((i)=>(
          <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/50" />
        ))}
      </div>
    )
  }
  if (tasks.length===0&&page===1) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 py-24 text-center dark:border-slate-700/50 dark:bg-slate-900/20">
        <p className="text-base font-semibold text-slate-700 dark:text-slate-200">Inbox Zero!</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Type a task above and press enter.</p>
      </div>
    )
  }
  return (
    <div className="space-y-8 pt-2 flex flex-col min-h-[500px]">
      <div className="flex-1 space-y-8">
        {groups.map((g)=>(
          <section key={g.id}>
            <h3 className="mb-4 text-sm font-bold tracking-wide text-slate-700 dark:text-slate-300">{g.label}</h3>
            <ul className="space-y-2.5">
              {g.tasks.map((task)=>(
                <TaskItem
                  key={task.id}
                  task={task}
                  groupId={g.id}
                  onToggleStatus={onToggleStatus}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
      {totalPages>1&&(
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
          <button
            disabled={page<=1}
            onClick={()=>setPage(page-1)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page>=totalPages}
            onClick={()=>setPage(page+1)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
