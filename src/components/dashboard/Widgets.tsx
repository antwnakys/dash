import { Pause, Play } from 'lucide-react'
import type { ReactNode } from 'react'
import { useDashboard } from '@/context/DashboardContext'
import { usePendingByCourse } from '@/components/courses/usePendingByCourse'
import { cn } from '@/lib/cn'
import { countdown, fmt, isSameDay } from '@/lib/date'
import { hoursLabel, minutesOn, weekMinutes } from '@/lib/focusStats'
import { courseColors } from '@/lib/courseColor'
import { focusTasks } from '@/lib/taskViews'
import { fmtLeft } from '@/hooks/useFocusTimer'

/** A glass widget: label on top, content below. `glow` adds the soft light from the top corner. */
export function Widget({ title, meta, action, glow, children, className, onClick }: { title: string; meta?: ReactNode; action?: ReactNode; glow?: 'metal' | 'blue'; children: ReactNode; className?: string; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} className={cn('surface relative flex min-h-44 flex-col overflow-hidden p-4 text-left', onClick && 'pressable', className)}>
      {glow && (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full opacity-70 blur-2xl"
          style={{ background: `radial-gradient(closest-side, ${glow === 'metal' ? 'color-mix(in srgb, var(--metal) 45%, transparent)' : 'color-mix(in srgb, var(--accent) 35%, transparent)'}, transparent)` }}
        />
      )}
      <div className="relative flex items-start gap-2">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
          <span className="truncate text-subhead font-medium text-ink">{title}</span>
          {meta && <span className="truncate text-caption text-muted">{meta}</span>}
        </span>
        {action}
      </div>
      <div className="relative mt-auto">{children}</div>
    </Tag>
  )
}

const big = (m: number) => {
  const h = Math.floor(m / 60)
  return h ? `${h}h ${m % 60}m` : `${m}m`
}

/** Study time today (real focus sessions), this week, and the timer's state with a play/pause button. */
export function StudyTimeWidget({ now }: { now: Date }) {
  const { focusSessions, focus, setFocusOpen } = useDashboard()
  const today = minutesOn(focusSessions.items, now)
  const week = weekMinutes(focusSessions.items, now).total
  const sessions = focusSessions.items.filter((s) => isSameDay(new Date(s.start), now)).length
  return (
    <Widget
      title="Study time"
      meta={`${sessions} ${sessions === 1 ? 'session' : 'sessions'} today`}
      glow="metal"
      action={
        <button
          onClick={() => (focus.running ? focus.pause() : focus.active ? focus.start() : setFocusOpen(true))}
          aria-label={focus.running ? 'Pause focus' : 'Start focus'}
          className="flex size-8 items-center justify-center rounded-full bg-fill-strong text-ink ring-1 ring-line"
        >
          {focus.running ? <Pause aria-hidden className="size-3.5" /> : <Play aria-hidden className="size-3.5 translate-x-px" />}
        </button>
      }
    >
      <div className="metric text-[2rem] leading-none text-ink sm:text-[2.5rem]">{focus.running ? fmtLeft(focus.left) : big(today)}</div>
      <div className="mt-1.5 text-subhead text-muted">{focus.running ? `Focusing · ${big(today)} today` : `${hoursLabel(week)} this week`}</div>
    </Widget>
  )
}

/** Today's goals done as a ring and a percentage. */
export function CompletionWidget({ now }: { now: Date }) {
  const { tasks, setView } = useDashboard()
  const open = focusTasks(tasks.tasks, now).length
  const done = tasks.tasks.filter((t) => t.done && t.completedAt && isSameDay(new Date(t.completedAt), now)).length
  const total = open + done
  const pct = total ? Math.round((done / total) * 100) : 0
  const R = 30
  const C = 2 * Math.PI * R
  return (
    <Widget title="Task completion" meta="today" onClick={() => setView('tasks')}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="metric text-[2rem] leading-none text-ink sm:text-[2.5rem]">{total ? `${pct}%` : '—'}</div>
          <div className="mt-1.5 text-subhead text-muted">{total ? `${done} done · ${open} to go` : 'Nothing planned for today'}</div>
        </div>
        <svg viewBox="0 0 72 72" className="size-12 shrink-0 -rotate-90 sm:size-16" aria-hidden>
          <circle cx="36" cy="36" r={R} fill="none" stroke="var(--fill-strong)" strokeWidth="5" />
          <circle cx="36" cy="36" r={R} fill="none" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} className="transition-[stroke-dashoffset] duration-700" />
        </svg>
      </div>
    </Widget>
  )
}

/** Focus minutes per day this week as bars, with the best day marked. */
export function WeekFocusWidget({ now }: { now: Date }) {
  const { focusSessions, setFocusOpen } = useDashboard()
  const { days, minutes, total } = weekMinutes(focusSessions.items, now)
  const max = Math.max(30, ...minutes)
  const best = minutes.indexOf(Math.max(...minutes))
  return (
    <Widget title="Focus this week" meta={hoursLabel(total)} glow="blue" onClick={() => setFocusOpen(true)}>
      <div className="flex h-24 items-end gap-1.5">
        {days.map((d, i) => {
          const today = isSameDay(d, now)
          return (
            <div key={d.toISOString()} className="flex flex-1 flex-col items-center gap-1" title={`${fmt.weekday.format(d)}: ${hoursLabel(minutes[i])}`}>
              <div className="relative flex h-20 w-full items-end overflow-hidden rounded-[0.35rem] bg-fill">
                <div
                  className={cn('w-full rounded-[0.35rem] transition-[height] duration-700', today ? 'bg-accent' : i === best && minutes[i] ? 'bg-[var(--metal)]' : 'bg-ink/55')}
                  style={{ height: minutes[i] ? `${Math.max(8, (minutes[i] / max) * 100)}%` : 0 }}
                />
              </div>
              <span className={cn('text-[0.625rem] font-medium', today ? 'text-accent' : 'text-muted')}>{fmt.weekdayShort.format(d).slice(0, 2)}</span>
            </div>
          )
        })}
      </div>
    </Widget>
  )
}

/** The next deadlines and exams with their countdowns. */
export function DeadlinesWidget({ now }: { now: Date }) {
  const { agenda, openEditor, setView } = useDashboard()
  const next = agenda.filter((i) => (i.kind === 'assignment' || i.kind === 'exam' || i.kind === 'quiz') && i.date >= now).slice(0, 3)
  const overdue = agenda.filter((i) => (i.kind === 'assignment' || i.kind === 'quiz') && i.date < now).length
  return (
    <Widget title="Deadlines" meta={overdue ? <span className="text-danger">{overdue} overdue</span> : undefined}>
      {next.length === 0 ? (
        <p className="text-subhead text-muted">Nothing due. Enjoy it.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {next.map((i) => (
            <li key={i.id}>
              <button onClick={() => (i.source === 'assignment' ? openEditor({ type: 'deadline', id: i.id }) : setView('exams'))} className="flex w-full items-baseline gap-2 text-left">
                <span className={cn('min-w-0 flex-1 truncate text-body', i.kind === 'exam' ? 'font-medium text-ink' : 'text-ink')}>{i.title}</span>
                <span className={cn('shrink-0 text-caption tabular-nums', i.kind === 'exam' ? 'text-accent' : 'text-muted')}>{countdown(i.date, now)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  )
}

/** Syllabus progress per course and how much is still open. */
export function AcademicWidget({ now }: { now: Date }) {
  const { courses, openEditor } = useDashboard()
  const pending = usePendingByCourse(now)
  if (!courses.items.length) return null
  return (
    <Widget title="Academic progress" meta={`${courses.items.length} courses`} className="min-h-0">
      <ul className="mt-3 flex flex-col gap-2.5">
        {courses.items.map((c) => (
          <li key={c.id}>
            <button onClick={() => openEditor({ type: 'course', id: c.id })} className="flex w-full items-center gap-3 text-left">
              <span className="size-2 shrink-0 rounded-full" style={{ background: c.color ? courseColors[c.color] : 'var(--faint)' }} />
              <span className="w-32 min-w-0 shrink-0 truncate text-subhead text-ink sm:w-44">{c.name}</span>
              <span className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-fill-strong">
                <span className="block h-full rounded-full bg-ink/70" style={{ width: `${Math.round(c.progress * 100)}%` }} />
              </span>
              <span className="w-24 shrink-0 text-right text-caption text-muted tabular-nums">
                {Math.round(c.progress * 100)}% · {pending.get(c.id)?.length ?? 0} open
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Widget>
  )
}
