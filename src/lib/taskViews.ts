/** Which tasks each Tasks view shows, search, and sort orders. Pure, so it's easy to reason about. */
import { addDays, startOfDay } from './date'
import { overdueFirst } from './taskDue'
import type { Task, TaskCategory } from '@/types'

export type TaskView = 'open' | 'today' | 'upcoming' | 'done'
export type TaskSort = 'manual' | 'due' | 'priority'

const dueAt = (t: Task) => (t.due ? new Date(t.due).getTime() : Infinity)
const prio = (t: Task) => t.priority ?? 4

/** Due by the end of today (overdue included). */
export const dueToday = (t: Task, now: Date) => !!t.due && new Date(t.due) < addDays(startOfDay(now), 1)

export function matchesSearch(t: Task, q: string): boolean {
  if (!q) return true
  const needle = q.toLocaleLowerCase()
  return [t.title, t.notes ?? '', ...(t.subtasks ?? []).map((s) => s.title)].some((s) => s.toLocaleLowerCase().includes(needle))
}

export function selectTasks(
  all: Task[],
  { view, category, query, sort, now }: { view: TaskView; category: 'all' | TaskCategory; query: string; sort: TaskSort; now: Date },
): Task[] {
  let list = all.filter((t) => (category === 'all' || t.category === category) && matchesSearch(t, query.trim()))
  if (view === 'done') {
    return list.filter((t) => t.done).sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
  }
  list = list.filter((t) => !t.done)
  if (view === 'today') list = list.filter((t) => dueToday(t, now) || t.priority === 1)
  if (view === 'upcoming') list = list.filter((t) => t.due && !dueToday(t, now)).sort((a, b) => dueAt(a) - dueAt(b))
  if (sort === 'due') list = [...list].sort((a, b) => dueAt(a) - dueAt(b) || prio(a) - prio(b))
  else if (sort === 'priority') list = [...list].sort((a, b) => prio(a) - prio(b) || dueAt(a) - dueAt(b))
  return view === 'upcoming' || sort !== 'manual' ? list : overdueFirst(list, now)
}

export function viewCounts(all: Task[], now: Date): Record<TaskView, number> {
  const open = all.filter((t) => !t.done)
  return {
    open: open.length,
    today: open.filter((t) => dueToday(t, now) || t.priority === 1).length,
    upcoming: open.filter((t) => t.due && !dueToday(t, now)).length,
    done: all.length - open.length,
  }
}
