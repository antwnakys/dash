import { Plus } from 'lucide-react'
import { Agenda } from '@/components/calendar/Agenda'
import { MiniCalendar } from '@/components/calendar/MiniCalendar'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { useDashboard } from '@/context/DashboardContext'

export function CalendarView() {
  const { openEditor, calendar } = useDashboard()
  return (
    <>
      <PageHeader
        eyebrow={calendar.google.account ? `Synced with ${calendar.google.account.email}` : calendar.status === 'off' ? 'Not connected to Google Calendar' : 'Synced from iCal links'}
        title="Calendar"
        aside={
          <Button variant="primary" onClick={() => openEditor({ type: 'event' })}>
            <Plus aria-hidden className="size-4" strokeWidth={2.4} />
            Add event
          </Button>
        }
      />
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <div className="xl:sticky xl:top-8">
          <MiniCalendar large />
        </div>
        <Agenda title="Schedule" />
      </div>
    </>
  )
}
