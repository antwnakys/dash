import { AnimatePresence, motion } from 'framer-motion'
import { Plus, RefreshCw } from 'lucide-react'
import { useMemo } from 'react'
import { AgendaIcon } from '@/components/ui/AgendaIcon'
import { CountdownBadge } from '@/components/ui/CountdownBadge'
import { IconButton } from '@/components/ui/IconButton'
import { Panel } from '@/components/ui/Panel'
import { useDashboard } from '@/context/DashboardContext'
import { useNow } from '@/hooks/useNow'
import { kindLabel } from '@/lib/agenda'
import { cn } from '@/lib/cn'
import { dayDiff, fmt, isSameDay, startOfDay } from '@/lib/date'
import type { AgendaItem } from '@/types'

function dayHeading(d: Date, now: Date): string {
  const diff = dayDiff(now, d)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return fmt.shortDate.format(d)
}

export function Agenda({ limit }: { limit?: number }) {
  const { agenda, selectedDate, openEditor, calendar } = useDashboard()
  const now = useNow(60_000)

  const groups = useMemo(() => {
    const from = startOfDay(selectedDate)
    const upcoming = agenda.filter((i) => i.date >= from && (!isSameDay(i.date, now) || i.allDay || i.date >= now))
    const items = limit ? upcoming.slice(0, limit) : upcoming
    const byDay = new Map<string, { date: Date; items: AgendaItem[] }>()
    for (const item of items) {
      const k = startOfDay(item.date).toDateString()
      if (!byDay.has(k)) byDay.set(k, { date: startOfDay(item.date), items: [] })
      byDay.get(k)!.items.push(item)
    }
    return [...byDay.values()]
  }, [agenda, selectedDate, now, limit])

  const viewingToday = isSameDay(selectedDate, now)

  return (
    <Panel
      title="Agenda"
      meta={viewingToday ? 'Upcoming' : `From ${fmt.shortDate.format(selectedDate)}`}
      action={
        <div className="flex">
          {calendar.status !== 'off' && (
            <IconButton
              icon={RefreshCw}
              label={calendar.status === 'error' ? `Sync failed: ${calendar.error}` : 'Sync calendar'}
              onClick={calendar.sync}
              className={cn(
                calendar.status === 'syncing' && '[&>svg]:animate-spin',
                calendar.status === 'error' && 'text-red-300/80',
              )}
            />
          )}
          <IconButton icon={Plus} label="Add deadline or event" onClick={() => openEditor({ type: 'deadline' })} />
        </div>
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={selectedDate.toDateString()}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col gap-5"
        >
          {groups.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-muted">Nothing scheduled from this day on.</p>
              <button onClick={() => openEditor({ type: 'event' })} className="text-sm text-accent hover:underline">
                Add an event
              </button>
            </div>
          )}
          {groups.map(({ date, items }) => (
            <div key={date.toDateString()}>
              <h3 className="mb-1.5 text-xs text-faint">{dayHeading(date, now)}</h3>
              <ol className="flex flex-col">
                {items.map((item) => {
                  const exam = item.kind === 'exam'
                  return (
                    <li key={item.id}>
                      <button
                        // Synced calendar entries are read-only; edit them in Google Calendar.
                        disabled={item.source === 'calendar'}
                        onClick={() =>
                          openEditor(item.source === 'assignment' ? { type: 'deadline', id: item.id } : { type: 'event', id: item.id })
                        }
                        className={cn(
                          'relative flex w-full items-center gap-3 rounded-xl py-2 pr-1 pl-3 text-left transition-colors enabled:hover:bg-white/[0.03]',
                          exam && 'bg-accent/[0.06] hover:bg-accent/[0.09]',
                        )}
                      >
                      {exam && <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent" />}
                      <span className="w-11 shrink-0 text-xs text-muted tabular-nums">
                        {item.allDay ? 'All day' : fmt.time.format(item.date)}
                      </span>
                      <AgendaIcon
                        kind={item.kind}
                        className={cn('size-4 shrink-0', exam ? 'text-accent' : 'text-faint')}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">
                          <span className="sr-only">{kindLabel[item.kind]}: </span>
                          {item.title}
                        </p>
                        {item.context && <p className="truncate text-xs text-faint">{item.context}</p>}
                      </div>
                      <CountdownBadge date={item.date} now={now} />
                      </button>
                    </li>
                  )
                })}
              </ol>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </Panel>
  )
}
