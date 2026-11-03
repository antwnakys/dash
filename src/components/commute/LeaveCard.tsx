import { TrainFront } from 'lucide-react'
import { useMemo } from 'react'
import { useDashboard } from '@/context/DashboardContext'
import { useNow } from '@/hooks/useNow'
import { CAMPUS } from '@/lib/campus'
import { cn } from '@/lib/cn'
import { COMMUTE_ROUTE, DEFAULT_COMMUTE, nextDeparture } from '@/lib/commute'
import { fmt } from '@/lib/date'

const inWords = (mins: number) => (mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} h${mins % 60 ? ` ${mins % 60} min` : ''}`)

/** "Leave by 08:10 for Databases": when to set off for the first class of the day. */
export function LeaveCard() {
  const { agenda, courses, profile, openEditor } = useDashboard()
  const now = useNow(30_000)
  const minutes = profile.commuteMinutes ?? DEFAULT_COMMUTE
  const trip = useMemo(() => nextDeparture(agenda, courses.items, now, minutes), [agenda, courses.items, now, minutes])
  if (!trip) return null

  const left = Math.ceil((trip.leaveAt.getTime() - now.getTime()) / 60_000)
  const late = left <= 0
  const soon = !late && left <= 60 && !trip.tomorrow
  const headline = trip.tomorrow
    ? `Tomorrow, leave by ${fmt.time.format(trip.leaveAt)}`
    : late
      ? 'Leave now'
      : soon
        ? `Leave in ${inWords(left)}`
        : `Leave by ${fmt.time.format(trip.leaveAt)}`
  const detail = late
    ? `${inWords(-left)} later than usual. ${trip.title} starts at ${fmt.time.format(trip.classAt)}.`
    : `${trip.title} at ${fmt.time.format(trip.classAt)} · ${CAMPUS.split(',')[0]}`

  return (
    <button
      onClick={() => openEditor({ type: 'settings', section: 'commute' })}
      aria-label={`${headline}. ${detail} Change travel time`}
      className="surface flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-fill/60"
    >
      <span
        aria-hidden
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full',
          late ? 'bg-danger/14 text-danger' : soon ? 'bg-accent/12 text-accent' : 'bg-course/14 text-course',
        )}
      >
        <TrainFront className="size-5" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-headline tabular-nums', late ? 'text-danger' : 'text-ink')}>{headline}</span>
        <span className="block text-subhead text-muted">{detail}</span>
        <span className="mt-0.5 block truncate text-caption text-faint">
          About {inWords(minutes)} · {COMMUTE_ROUTE}
        </span>
      </span>
    </button>
  )
}
