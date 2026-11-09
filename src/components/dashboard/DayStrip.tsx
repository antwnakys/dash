import { Plus } from 'lucide-react'
import { useDashboard } from '@/context/DashboardContext'
import { editTarget } from '@/lib/agenda'
import { dayEntries, type CalEntry } from '@/lib/calendarDay'
import { cn } from '@/lib/cn'
import { fmt, isSameDay } from '@/lib/date'

const tone: Record<CalEntry['kind'] | 'focus', string> = {
  class: 'bg-course/14 text-ink ring-course/40',
  exam: 'bg-accent/16 text-ink ring-accent/50',
  quiz: 'bg-accent/12 text-ink ring-accent/40',
  assignment: 'bg-fill-strong text-ink ring-line',
  task: 'bg-fill text-ink ring-line',
  event: 'bg-fill text-ink ring-line',
  reminder: 'bg-fill text-ink ring-line',
  focus: 'bg-[color-mix(in_srgb,var(--metal)_16%,transparent)] text-ink ring-[color-mix(in_srgb,var(--metal)_40%,transparent)]',
}

interface Block {
  key: string
  title: string
  start: Date
  end: Date
  kind: CalEntry['kind'] | 'focus'
  due?: boolean
  entry?: CalEntry
}

/**
 * Today from morning to evening on one horizontal line: classes, events, exams and finished focus sessions as blocks at
 * their real times, deadlines and dated tasks as markers, and a line at the current time. Tap anything to open it.
 */
export function DayStrip({ now }: { now: Date }) {
  const { agenda, courses, focusSessions, openEditor } = useDashboard()
  const entries = dayEntries(now, agenda, courses.items).filter((e) => !e.allDay)
  const blocks: Block[] = [
    ...entries.map((e) => {
      const due = (e.kind === 'assignment' || e.kind === 'task' || e.kind === 'quiz') && !e.end
      return { key: e.key, title: e.title, start: e.start, end: e.end ?? new Date(e.start.getTime() + (due ? 0 : 3_600_000)), kind: e.kind, due, entry: e }
    }),
    ...focusSessions.items
      .filter((s) => isSameDay(new Date(s.start), now))
      .map((s) => ({ key: `focus-${s.id}`, title: `Focus · ${s.minutes} min`, start: new Date(s.start), end: new Date(new Date(s.start).getTime() + s.minutes * 60_000), kind: 'focus' as const })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime())
  const allDay = dayEntries(now, agenda, courses.items).filter((e) => e.allDay)

  const startH = Math.min(8, ...blocks.map((b) => b.start.getHours()))
  const endH = Math.max(20, ...blocks.map((b) => b.end.getHours() + (b.end.getMinutes() ? 1 : 0)))
  const span = (endH - startH) * 60
  const x = (d: Date) => `${(((d.getHours() - startH) * 60 + d.getMinutes()) / span) * 100}%`
  const w = (a: Date, b: Date) => `${(Math.max(20, (b.getTime() - a.getTime()) / 60_000) / span) * 100}%`

  // Two lanes so things at the same time don't overlap.
  const laneEnd = [0, 0]
  const placed = blocks.map((b) => {
    const lane = b.due ? 2 : b.start.getTime() >= laneEnd[0] ? 0 : b.start.getTime() >= laneEnd[1] ? 1 : 0
    if (lane < 2) laneEnd[lane] = Math.max(laneEnd[lane], b.end.getTime())
    return { ...b, lane }
  })
  const hours = Array.from({ length: endH - startH + 1 }, (_, i) => startH + i)
  const open = (b: Block) => {
    const t = b.entry?.item ? editTarget(b.entry.item) : b.entry?.courseId ? ({ type: 'course', id: b.entry.courseId } as const) : null
    if (t) openEditor(t)
  }

  return (
    <section aria-label="Daily timeline" className="surface overflow-hidden">
      <header className="flex items-center gap-3 px-4 pt-3.5">
        <h2 className="text-subhead font-medium text-ink">Daily timeline</h2>
        <span className="truncate text-caption text-muted max-sm:hidden">
          {entries.length + allDay.length} {entries.length + allDay.length === 1 ? 'item' : 'items'} today
          {allDay.length > 0 && ` · all day: ${allDay.map((a) => a.title).join(', ')}`}
        </span>
        <button onClick={() => openEditor({ type: 'event' })} className="ml-auto flex shrink-0 items-center gap-1 text-subhead font-medium text-accent hover:underline">
          <Plus aria-hidden className="size-3.5" strokeWidth={2.4} />
          <span className="max-sm:hidden">Add an event</span>
          <span className="sm:hidden">Add</span>
        </button>
      </header>
      <div className="scrollbar-none overflow-x-auto">
        <div className="relative mx-4 mt-2 mb-3 min-w-[44rem]" style={{ height: 136 }}>
          {hours.map((h) => (
            <div key={h} className="absolute top-0 bottom-0 border-l border-line" style={{ left: x(new Date(now.getFullYear(), now.getMonth(), now.getDate(), h)) }}>
              <span className="absolute top-0 left-1.5 text-caption text-faint tabular-nums">{String(h).padStart(2, '0')}:00</span>
            </div>
          ))}
          {placed.map((b) => (
            <button
              key={b.key}
              onClick={() => open(b)}
              title={`${fmt.time.format(b.start)} ${b.title}`}
              className={cn(
                'absolute truncate rounded-[0.5rem] px-2 text-left text-caption font-medium ring-1 transition-[filter] hover:brightness-110',
                tone[b.kind],
                b.due ? 'h-6 leading-6' : 'h-9 leading-9',
              )}
              style={{
                left: x(b.start),
                width: b.due ? 'auto' : w(b.start, b.end),
                maxWidth: b.due ? '12rem' : undefined,
                top: b.lane === 2 ? 104 : 24 + b.lane * 40,
              }}
            >
              {b.due ? `◆ ${fmt.time.format(b.start)} ${b.title}` : b.title}
            </button>
          ))}
          <div aria-hidden className="pointer-events-none absolute top-5 bottom-0 z-10 border-l border-danger" style={{ left: x(now) }}>
            <span className="absolute -top-1 -left-[3px] size-1.5 rounded-full bg-danger" />
          </div>
          {blocks.length === 0 && <p className="absolute inset-x-0 top-12 text-center text-subhead text-muted">Nothing at a set time today.</p>}
        </div>
      </div>
    </section>
  )
}
