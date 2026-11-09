import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useDashboard } from '@/context/DashboardContext'
import { useNow } from '@/hooks/useNow'
import { addDays, fmt, isSameDay, weekOf } from '@/lib/date'
import { hoursLabel, weekMinutes } from '@/lib/focusStats'
import { dueText } from '@/lib/taskDue'
import { onDay } from '@/lib/calendarDay'
import type { AgendaItem } from '@/types'

const DUE = new Set<AgendaItem['kind']>(['assignment', 'exam', 'quiz', 'task'])

function Block({ title, meta, children }: { title: string; meta?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="px-1 text-subhead font-semibold text-ink">
        {title}
        {meta && <span className="ml-2 font-normal text-muted">{meta}</span>}
      </h3>
      {children}
    </section>
  )
}

/**
 * Weekly review (Today → This week → Review, or ⌘K): what got done and how much you focused, what slipped (move it
 * to tomorrow or next Monday, or tick it), and what next week holds.
 */
export function WeeklyReview({ onDone }: { onDone: () => void }) {
  const { tasks, assignments, agenda, focusSessions, notify, setView, setSelectedDate } = useDashboard()
  const now = useNow(60_000)
  const days = weekOf(now)
  const nextMonday = addDays(days[0], 7)
  const done = tasks.tasks.filter((t) => t.done && t.completedAt && new Date(t.completedAt) >= days[0])
  const submitted = assignments.items.filter((a) => a.submitted && new Date(a.due) >= days[0] && new Date(a.due) < nextMonday).length
  const focus = weekMinutes(focusSessions.items, now)
  const slipped = tasks.tasks.filter((t) => !t.done && t.due && new Date(t.due) < now && !(t.dueAllDay && isSameDay(new Date(t.due), now)))
  const lateWork = assignments.items.filter((a) => !a.submitted && new Date(a.due) < now)
  const next = agenda.filter((i) => DUE.has(i.kind) && i.date >= nextMonday && i.date < addDays(nextMonday, 7))

  const moveTask = (id: string, due: string, to: Date) => {
    tasks.update(id, { due: onDay(new Date(due), to).toISOString() })
    notify(`Moved to ${fmt.shortDate.format(to)}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-2">
        {[
          ['Tasks done', String(done.length)],
          ['Work handed in', String(submitted)],
          ['Focus', hoursLabel(focus.total)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[var(--radius-control)] bg-fill/60 px-3 py-2.5">
            <div className="text-caption text-muted">{label}</div>
            <div className="text-title text-ink tabular-nums">{value}</div>
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <Block title="Done this week">
          <ul className="separated overflow-hidden rounded-[var(--radius-control)] bg-fill/60">
            {done.slice(0, 8).map((t) => (
              <li key={t.id} className="flex items-center gap-2.5 px-3.5 py-2 text-body text-muted">
                <Check aria-hidden className="size-4 shrink-0 text-course" strokeWidth={2.6} />
                <span className="truncate">{t.title}</span>
              </li>
            ))}
            {done.length > 8 && <li className="px-3.5 py-2 text-subhead text-faint">and {done.length - 8} more</li>}
          </ul>
        </Block>
      )}

      <Block title="Still open" meta={slipped.length + lateWork.length ? `${slipped.length + lateWork.length} past due` : 'nothing slipped'}>
        {slipped.length + lateWork.length === 0 ? (
          <p className="px-1 text-body text-muted">Everything due so far is done. 👏</p>
        ) : (
          <ul className="separated overflow-hidden rounded-[var(--radius-control)] bg-fill/60">
            {slipped.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-2 px-3.5 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body text-ink">{t.title}</span>
                  <span className="block text-caption text-danger">Was due {dueText(t.due!, t.dueAllDay, now)}</span>
                </span>
                <Button size="sm" onClick={() => moveTask(t.id, t.due!, addDays(now, 1))}>
                  Tomorrow
                </Button>
                <Button size="sm" onClick={() => moveTask(t.id, t.due!, nextMonday)}>
                  Monday
                </Button>
                <Button size="sm" variant="plain" onClick={() => tasks.toggle(t.id)} aria-label={`Mark “${t.title}” done`}>
                  <Check aria-hidden className="size-4" strokeWidth={2.4} />
                </Button>
              </li>
            ))}
            {lateWork.map((a) => (
              <li key={a.id} className="flex items-center gap-2 px-3.5 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body text-ink">{a.title}</span>
                  <span className="block text-caption text-danger">Deadline {fmt.shortDate.format(new Date(a.due))}</span>
                </span>
                <Button size="sm" onClick={() => assignments.update(a.id, { submitted: true })}>
                  Handed in
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Block>

      <Block title="Next week" meta={`${fmt.dayMonth.format(nextMonday)} – ${fmt.dayMonth.format(addDays(nextMonday, 6))}`}>
        {next.length === 0 ? (
          <p className="px-1 text-body text-muted">Nothing due yet.</p>
        ) : (
          <ul className="separated overflow-hidden rounded-[var(--radius-control)] bg-fill/60">
            {next.map((i) => (
              <li key={`${i.source}-${i.id}`} className="flex items-center gap-3 px-3.5 py-2">
                <span className="w-16 shrink-0 text-subhead text-muted">{fmt.weekdayShort.format(i.date)}</span>
                <span className="min-w-0 flex-1 truncate text-body text-ink">{i.title}</span>
                {i.kind === 'exam' && <span className="rounded-[0.35rem] bg-accent/12 px-1.5 py-px text-caption font-semibold text-accent">Exam</span>}
              </li>
            ))}
          </ul>
        )}
      </Block>

      <Button
        variant="primary"
        className="w-full"
        onClick={() => {
          setSelectedDate(nextMonday)
          try {
            localStorage.setItem('dash.calendarMode.v1', 'week')
          } catch {
            // Only a convenience.
          }
          setView('calendar')
          onDone()
        }}
      >
        Plan next week
        <ArrowRight aria-hidden className="size-4" strokeWidth={2.4} />
      </Button>
    </div>
  )
}
