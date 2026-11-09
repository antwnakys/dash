import { useDashboard } from '@/context/DashboardContext'
import { isMovable } from '@/lib/agenda'
import { onDay } from '@/lib/calendarDay'
import { fmt, isSameDay } from '@/lib/date'
import type { AgendaItem } from '@/types'

/** Move a deadline, own event or task to another day (same time of day), with Undo. */
export function useMoveItem() {
  const { tasks, assignments, events, notify } = useDashboard()

  return (item: AgendaItem, toDay: Date) => {
    if (isSameDay(item.date, toDay)) return
    if (!isMovable(item)) {
      notify('This one comes from Google Calendar. Move it there.', 'error')
      return
    }
    let undo: (() => void) | undefined
    if (item.source === 'task') {
      const task = tasks.tasks.find((t) => t.id === item.id)
      if (!task?.due) return
      tasks.update(task.id, { due: onDay(new Date(task.due), toDay).toISOString() })
      undo = () => tasks.update(task.id, { due: task.due })
    } else if (item.source === 'assignment') {
      const a = assignments.items.find((x) => x.id === item.id)
      if (!a) return
      assignments.update(a.id, { due: onDay(new Date(a.due), toDay).toISOString() })
      undo = () => assignments.update(a.id, { due: a.due })
    } else if (item.source === 'event') {
      const e = events.items.find((x) => x.id === item.id)
      if (!e) return
      const start = onDay(new Date(e.start), toDay)
      const shift = start.getTime() - new Date(e.start).getTime()
      events.update(e.id, { start: start.toISOString(), end: e.end ? new Date(new Date(e.end).getTime() + shift).toISOString() : undefined })
      undo = () => events.update(e.id, { start: e.start, end: e.end })
    }
    if (undo) notify(`Moved to ${fmt.shortDate.format(toDay)}`, 'default', { label: 'Undo', run: undo })
  }
}
