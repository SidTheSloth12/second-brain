import type { Task } from '../types/task'

export type TaskGroupId = 'overdue' | 'today' | 'tomorrow' | 'thisWeek' | 'later' | 'noDate' | 'completed'

export type TaskGroup = {
  id: TaskGroupId
  label: string
  tasks: Task[]
}

function startOfDay(d: Date): number {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}

function addDays(ts: number, days: number): number {
  const x = new Date(ts)
  x.setDate(x.getDate() + days)
  return startOfDay(x)
}

/** Calendar-friendly: group open tasks by due date in the user's local timezone. */
export function groupTasksForDisplay(tasks: Task[]): TaskGroup[] {
  const now = new Date()
  const todayStart = startOfDay(now)
  const tomorrowStart = addDays(todayStart, 1)
  const weekEndStart = addDays(todayStart, 7)

  const open = tasks.filter((t) => t.status === 'open')
  const completed = tasks.filter((t) => t.status === 'completed')

  const buckets: Record<TaskGroupId, Task[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: [],
    noDate: [],
    completed: [],
  }

  for (const t of open) {
    if (!t.dueAt) {
      buckets.noDate.push(t)
      continue
    }
    const dueDay = startOfDay(new Date(t.dueAt))
    if (dueDay < todayStart) buckets.overdue.push(t)
    else if (dueDay === todayStart) buckets.today.push(t)
    else if (dueDay === tomorrowStart) buckets.tomorrow.push(t)
    else if (dueDay < weekEndStart) buckets.thisWeek.push(t)
    else buckets.later.push(t)
  }

  const order: TaskGroupId[] = ['overdue', 'today', 'tomorrow', 'thisWeek', 'later', 'noDate']
  const labels: Record<TaskGroupId, string> = {
    overdue: 'Overdue',
    today: 'Today',
    tomorrow: 'Tomorrow',
    thisWeek: 'This week',
    later: 'Later',
    noDate: 'No due date',
    completed: 'Completed',
  }

  const groups: TaskGroup[] = order
    .filter((id) => buckets[id].length > 0)
    .map((id) => ({ id, label: labels[id], tasks: buckets[id] }))

  if (completed.length > 0) {
    groups.push({ id: 'completed', label: labels.completed, tasks: completed })
  }

  return groups
}
