import { AnimatePresence, Reorder } from 'framer-motion'
import { useState } from 'react'
import { Panel } from '@/components/ui/Panel'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Segmented } from '@/components/ui/Segmented'
import { useDashboard } from '@/context/DashboardContext'
import type { TaskCategory } from '@/types'
import { AddTask } from './AddTask'
import { TaskItem } from './TaskItem'
import { categories, categoryLabel } from './categories'

type Filter = 'all' | TaskCategory

const filters = [
  { value: 'all' as const, label: 'All' },
  ...categories.map((c) => ({ value: c, label: c === 'projects' ? 'Projects' : categoryLabel[c] })),
]

export function TaskList() {
  const { tasks } = useDashboard()
  const [filter, setFilter] = useState<Filter>('all')

  const visible = filter === 'all' ? tasks.tasks : tasks.tasks.filter((t) => t.category === filter)
  const done = visible.filter((t) => t.done).length

  return (
    <Panel
      title="To-do"
      meta={`${done} of ${visible.length} done`}
      action={<Segmented label="Filter tasks" options={filters} value={filter} onChange={setFilter} className="max-sm:hidden" />}
    >
      <Segmented label="Filter tasks" options={filters} value={filter} onChange={setFilter} className="mb-4 self-start sm:hidden" />
      <ProgressBar value={visible.length ? done / visible.length : 0} label="Tasks completed" className="mb-4" />
      <AddTask defaultCategory={filter === 'all' ? 'college' : filter} onAdd={tasks.add} />

      <Reorder.Group axis="y" values={visible} onReorder={tasks.reorder} className="mt-2 flex flex-col">
        <AnimatePresence initial={false}>
          {visible.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              showCategory={filter === 'all'}
              onToggle={() => tasks.toggle(task.id)}
              onRemove={() => tasks.remove(task.id)}
            />
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {visible.length === 0 && (
        <p className="py-8 text-center text-sm text-muted">No tasks here. Add one above.</p>
      )}
    </Panel>
  )
}
