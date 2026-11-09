import { AnimatePresence, Reorder } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { AddTask } from '@/components/tasks/AddTask'
import { TaskItem } from '@/components/tasks/TaskItem'
import { Card, Section } from '@/components/ui/Section'
import { useDashboard } from '@/context/DashboardContext'
import { useTaskActions } from '@/hooks/useTaskActions'
import { isSameDay, startOfDay } from '@/lib/date'
import { dueInfo, dueText } from '@/lib/taskDue'
import { focusTasks } from '@/lib/taskViews'
import type { Task, TaskCategory } from '@/types'

const MAX = 7

/** Today page: the short list to get through today, with a quick add that defaults to today. */
export function TodayFocus({ now }: { now: Date }) {
  const { tasks, notify, setView } = useDashboard()
  const actions = useTaskActions()
  const all = focusTasks(tasks.tasks, now)
  const shown = all.slice(0, MAX)
  const doneToday = tasks.tasks.filter((t) => t.done && t.completedAt && isSameDay(new Date(t.completedAt), now)).length
  const otherOpen = tasks.tasks.filter((t) => !t.done).length - shown.length

  const add = (title: string, category: TaskCategory, extra: Partial<Task>) => {
    // Added here without a date means "today".
    const due = extra.due ?? new Date(startOfDay(now).getTime() + (24 * 60 - 1) * 60_000).toISOString()
    const task = tasks.add(title, category, { ...extra, due, dueAllDay: extra.due ? extra.dueAllDay : true })
    notify(`Added for ${dueText(task.due!, task.dueAllDay)}`)
  }

  return (
    <Section title="Focus today" meta={(doneToday > 0 || all.length > 0) && `${doneToday} done${all.length ? ` · ${all.length} to go` : ''}`}>
      <Card>
        <AddTask defaultCategory="college" onAdd={add} />
        <Reorder.Group axis="y" values={shown} onReorder={() => {}} className="separated border-t border-line">
          <AnimatePresence initial={false}>
            {shown.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                showCategory={false}
                due={dueInfo(task, now)}
                reorderable={false}
                onToggle={() => actions.toggle(task)}
                onRemove={() => actions.remove(task)}
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>
        {shown.length === 0 && (
          <p className="border-t border-line px-4 py-5 text-center text-body text-muted">
            {doneToday ? 'All done for today.' : 'Nothing pressing today. Tasks due today, overdue ones and high-priority ones land here.'}
          </p>
        )}
        {otherOpen > 0 && (
          <button
            onClick={() => setView('tasks')}
            className="flex w-full items-center justify-between border-t border-line px-4 py-3 text-subhead text-muted transition-colors hover:bg-fill hover:text-ink"
          >
            {otherOpen} more open {otherOpen === 1 ? 'task' : 'tasks'}
            <ChevronRight aria-hidden className="size-4" />
          </button>
        )}
      </Card>
    </Section>
  )
}
