import { PageHeader } from '@/components/layout/PageHeader'
import { TaskList } from '@/components/tasks/TaskList'
import { useDashboard } from '@/context/DashboardContext'

export function TasksView() {
  const { tasks } = useDashboard()
  const open = tasks.tasks.filter((t) => !t.done).length
  return (
    <div className="mx-auto max-w-[44rem]">
      <PageHeader
        eyebrow="To do"
        title="Tasks"
        summary={tasks.tasks.length > 0 && (open === 0 ? 'All done. Nice work.' : `${open} still open. Drag the handle to reorder.`)}
      />
      <TaskList title="All tasks" />
    </div>
  )
}
