import { Agenda } from '@/components/calendar/Agenda'
import { MiniCalendar } from '@/components/calendar/MiniCalendar'

export function CalendarView() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <MiniCalendar />
      </div>
      <div className="lg:col-span-7">
        <Agenda />
      </div>
    </div>
  )
}
