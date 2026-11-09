import { useDashboard } from '@/context/DashboardContext'
import { dueText } from '@/lib/taskDue'
import type { Task } from '@/types'

/** Tick, delete with Undo, and announce the next copy of a repeating task. */
export function useTaskActions() {
  const { tasks, notify } = useDashboard()
  return {
    toggle: (task: Task) => {
      const next = tasks.toggle(task.id)
      if (next?.due) notify(`Done. Next: ${dueText(next.due, next.dueAllDay)}`)
    },
    remove: (task: Task) => {
      const index = tasks.tasks.findIndex((t) => t.id === task.id)
      tasks.remove(task.id)
      notify(`Deleted “${task.title.length > 28 ? `${task.title.slice(0, 27)}…` : task.title}”`, 'default', {
        label: 'Undo',
        run: () => tasks.restore(task, index),
      })
    },
  }
}
