import { AnimatePresence, Reorder } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { useState } from 'react'
import { Segmented } from '@/components/ui/Segmented'
import { Card, Section } from '@/components/ui/Section'
import { useDashboard } from '@/context/DashboardContext'
import { useNow } from '@/hooks/useNow'
import { dueInfo } from '@/lib/taskDue'
import { selectTasks, viewCounts, type TaskSort, type TaskView } from '@/lib/taskViews'
import type { Task, TaskCategory } from '@/types'
import { useTaskActions } from '@/hooks/useTaskActions'
import { dueText } from '@/lib/taskDue'
import { AddTask } from './AddTask'
import { categories, categoryLabel } from './categories'
import { TaskItem } from './TaskItem'

type Filter = 'all' | TaskCategory

const filters = [{ value: 'all' as const, label: 'All' }, ...categories.map((c) => ({ value: c, label: categoryLabel[c] }))]

const sorts: Array<{ value: TaskSort; label: string }> = [
  { value: 'manual', label: 'My order' },
  { value: 'due', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
]

const empty: Record<TaskView, string> = {
  open: 'No open tasks. Type one above.',
  today: 'Nothing due today. Tasks due today, overdue ones and high-priority ones show here.',
  upcoming: 'Nothing scheduled. Give a task a date, e.g. “Essay draft friday”.',
  done: 'Nothing done yet.',
}

/**
 * The task list. `full` (Tasks tab): search, views (Open, Today, Upcoming, Done), category and sort.
 * Compact (Today page): open tasks with the category filter.
 */
export function TaskList({ title = 'Tasks', full = false }: { title?: string; full?: boolean }) {
  const { tasks, notify } = useDashboard()
  const actions = useTaskActions()
  const [filter, setFilter] = useState<Filter>('all')
  const [view, setView] = useState<TaskView>('open')
  const [sort, setSort] = useState<TaskSort>('manual')
  const [query, setQuery] = useState('')
  const now = useNow(60_000)

  const visible = selectTasks(tasks.tasks, { view: full ? view : 'open', category: filter, query: full ? query : '', sort: full ? sort : 'manual', now })
  const counts = viewCounts(tasks.tasks, now)
  const reorderable = (!full || (view === 'open' && sort === 'manual')) && !query
  const views: Array<{ value: TaskView; label: string }> = [
    { value: 'open', label: `Open${counts.open ? ` ${counts.open}` : ''}` },
    { value: 'today', label: `Today${counts.today ? ` ${counts.today}` : ''}` },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'done', label: 'Done' },
  ]

  const add = (text: string, category: TaskCategory, extra: Partial<Task>) => {
    const task = tasks.add(text, category, extra)
    notify(task.due ? `Added for ${dueText(task.due, task.dueAllDay)}` : 'Task added')
  }

  return (
    <Section
      title={title}
      meta={!full && visible.length > 0 && `${visible.length} open`}
      action={!full && <Segmented label="Filter tasks" options={filters} value={filter} onChange={setFilter} className="max-md:hidden" />}
    >
      {full ? (
        <div className="flex flex-col gap-2.5">
          <Segmented label="Show" options={views} value={view} onChange={setView} block />
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex h-9 min-w-0 flex-1 basis-56 items-center gap-2 rounded-[var(--radius-control)] bg-fill px-3 text-muted focus-within:bg-surface focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_30%,transparent)]">
              <Search aria-hidden className="size-4 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks, notes and steps"
                aria-label="Search tasks"
                data-task-search
                className="min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-faint focus:outline-none sm:text-[0.9375rem]"
              />
              {query && (
                <button onClick={() => setQuery('')} aria-label="Clear search" className="text-faint hover:text-ink">
                  <X aria-hidden className="size-4" />
                </button>
              )}
            </label>
            <Segmented label="Category" options={filters} value={filter} onChange={setFilter} />
            {view !== 'done' && view !== 'upcoming' && (
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as TaskSort)}
                aria-label="Sort"
                className="h-8 appearance-none rounded-[var(--radius-button)] bg-fill px-3 text-subhead font-medium text-muted outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {sorts.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      ) : (
        <Segmented label="Filter tasks" options={filters} value={filter} onChange={setFilter} block className="md:hidden" />
      )}
      <Card>
        {view !== 'done' && <AddTask defaultCategory={filter === 'all' ? 'college' : filter} onAdd={add} />}
        <Reorder.Group axis="y" values={visible} onReorder={tasks.reorder} className="separated border-t border-line first:border-t-0">
          <AnimatePresence initial={false}>
            {visible.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                showCategory={filter === 'all'}
                due={dueInfo(task, now)}
                reorderable={reorderable}
                onToggle={() => actions.toggle(task)}
                onRemove={() => actions.remove(task)}
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>
        {visible.length === 0 && (
          <p className="border-t border-line px-4 py-6 text-center text-body text-muted first:border-t-0">
            {query ? `No tasks match “${query}”.` : full ? empty[view] : filter === 'all' ? empty.open : `No open ${categoryLabel[filter].toLowerCase()} tasks.`}
          </p>
        )}
      </Card>
    </Section>
  )
}
