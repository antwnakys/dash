import { Agenda } from '@/components/calendar/Agenda'
import { MiniCalendar } from '@/components/calendar/MiniCalendar'
import { CoursesHub } from '@/components/courses/CoursesHub'
import { TaskList } from '@/components/tasks/TaskList'

export function OverviewView() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <CoursesHub />
      </div>
      <div className="lg:col-span-4">
        <MiniCalendar />
      </div>
      <div className="lg:col-span-7">
        <TaskList />
      </div>
      <div className="lg:col-span-5">
        <Agenda limit={7} />
      </div>
    </div>
  )
}
