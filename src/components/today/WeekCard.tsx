import { useMemo } from 'react'
import { Card, Section } from '@/components/ui/Section'
import { useDashboard } from '@/context/DashboardContext'
import { useExams } from '@/hooks/useExams'
import { cn } from '@/lib/cn'
import { addDays, countdown, fmt, isSameDay, weekOf } from '@/lib/date'
import type { AgendaItem } from '@/types'

const DUE_KINDS = new Set<AgendaItem['kind']>(['assignment', 'exam', 'quiz', 'task'])

/**
 * Today page: the week at a glance. How much got done, what's still due before Sunday, the next exam, and a
 * Monday–Sunday strip showing which days are heavy (deadlines, exams and dated tasks per day).
 */
export function WeekCard({ now }: { now: Date }) {
  const { agenda, tasks, setView } = useDashboard()
  const exams = useExams(now)
  const days = weekOf(now)
  const end = addDays(days[0], 7)

  const { load, dueLeft, doneThisWeek } = useMemo(() => {
    const due = agenda.filter((i) => DUE_KINDS.has(i.kind) && i.date >= days[0] && i.date < end)
    return {
      load: days.map((d) => due.filter((i) => isSameDay(i.date, d))),
      dueLeft: due.filter((i) => i.date >= now || (i.allDay && isSameDay(i.date, now))).length,
      doneThisWeek: tasks.tasks.filter((t) => t.done && t.completedAt && new Date(t.completedAt) >= days[0]).length,
    }
    // `days` and `end` follow `now`'s week.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agenda, tasks.tasks, days[0].getTime(), now])

  const max = Math.max(3, ...load.map((l) => l.length))
  const next = exams[0]

  return (
    <Section title="This week">
      <Card className="px-4 py-4">
        <dl className="grid grid-cols-3 gap-3">
          <div>
            <dt className="text-caption text-muted">Done</dt>
            <dd className="text-title tabular-nums text-ink">{doneThisWeek}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted">Due by Sunday</dt>
            <dd className={cn('text-title tabular-nums', dueLeft > 5 ? 'text-danger' : 'text-ink')}>{dueLeft}</dd>
          </div>
          <button onClick={() => setView('exams')} className="min-w-0 text-left">
            <dt className="text-caption text-muted">Next exam</dt>
            <dd className="truncate text-headline text-ink">{next ? next.subject : '—'}</dd>
            {next && <dd className="text-caption text-accent">{countdown(next.date, now)}</dd>}
          </button>
        </dl>
        <div className="mt-4 grid grid-cols-7 gap-1.5" role="list" aria-label="Deadlines per day this week">
          {days.map((d, i) => {
            const n = load[i].length
            const today = isSameDay(d, now)
            const past = d < now && !today
            return (
              <div
                key={d.toISOString()}
                role="listitem"
                title={load[i].map((x) => x.title).join('\n') || 'Nothing due'}
                aria-label={`${fmt.weekday.format(d)}: ${n} due`}
                className="flex flex-col items-center gap-1"
              >
                <div className="flex h-12 w-full items-end justify-center rounded-[0.4rem] bg-fill">
                  <div
                    className={cn('w-full rounded-[0.4rem] transition-[height]', today ? 'bg-accent' : past ? 'bg-faint/50' : 'bg-ink/70')}
                    style={{ height: n ? `${Math.max(18, (n / max) * 100)}%` : 0 }}
                  />
                </div>
                <span className={cn('text-caption tabular-nums', today ? 'font-semibold text-accent' : 'text-muted')}>
                  {fmt.weekdayShort.format(d).slice(0, 2)}
                </span>
              </div>
            )
          })}
        </div>
      </Card>
    </Section>
  )
}
