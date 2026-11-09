import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'
import { Checkbox } from '@/components/tasks/Checkbox'
import { useDashboard } from '@/context/DashboardContext'
import { useTaskActions } from '@/hooks/useTaskActions'
import { cn } from '@/lib/cn'
import { fmt, isSameDay } from '@/lib/date'
import { focusTasks } from '@/lib/taskViews'

/**
 * Today's goals as one horizontal strip: the date, how many of today's goals are done, and each goal as a chip you can
 * tick. Goals = what Focus today holds (overdue, due today, high priority) plus what you already ticked today.
 */
export function DailyGoals({ now }: { now: Date }) {
  const { tasks, openEditor } = useDashboard()
  const actions = useTaskActions()
  const scroller = useRef<HTMLDivElement>(null)
  const open = focusTasks(tasks.tasks, now)
  const doneToday = tasks.tasks.filter((t) => t.done && t.completedAt && isSameDay(new Date(t.completedAt), now))
  const goals = [...open, ...doneToday]
  const pct = goals.length ? doneToday.length / goals.length : 0
  const scroll = (dir: number) => scroller.current?.scrollBy({ left: dir * 280, behavior: 'smooth' })

  return (
    <div className="surface flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4">
      <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-[0.75rem] bg-fill ring-1 ring-line">
        <span className="text-headline leading-none text-ink tabular-nums">{now.getDate()}</span>
        <span className="text-[0.625rem] font-medium tracking-wide text-muted uppercase">{fmt.weekdayShort.format(now)}</span>
      </div>
      <div className="w-36 shrink-0 max-sm:hidden">
        <div className="text-subhead text-muted">Daily goals</div>
        <div className="text-body text-ink tabular-nums">
          <span className="font-semibold">{doneToday.length}</span>/{goals.length} completed
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-fill-strong">
          <div className="h-full rounded-full bg-ink transition-[width] duration-500" style={{ width: `${pct * 100}%` }} />
        </div>
      </div>
      <div ref={scroller} className="scrollbar-none flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto">
        {goals.length === 0 && <span className="py-2 text-subhead text-muted">No goals for today yet. Give a task today’s date or a high priority.</span>}
        {goals.map((t) => (
          <div key={t.id} className={cn('flex h-10 shrink-0 snap-start items-center gap-2 rounded-full bg-fill pr-3.5 pl-1.5 ring-1 ring-line', t.done && 'opacity-55')}>
            <span className="scale-[0.82]">
              <Checkbox checked={t.done} label={t.title} onToggle={() => actions.toggle(t)} />
            </span>
            <button onClick={() => openEditor({ type: 'task', id: t.id })} className={cn('max-w-56 truncate text-subhead', t.done ? 'text-muted line-through' : 'text-ink')}>
              {t.title}
            </button>
          </div>
        ))}
      </div>
      {goals.length > 3 && (
        <div className="flex shrink-0 gap-1 max-sm:hidden">
          <button onClick={() => scroll(-1)} aria-label="Scroll goals left" className="flex size-8 items-center justify-center rounded-full bg-fill text-muted ring-1 ring-line hover:text-ink">
            <ChevronLeft aria-hidden className="size-4" />
          </button>
          <button onClick={() => scroll(1)} aria-label="Scroll goals right" className="flex size-8 items-center justify-center rounded-full bg-fill text-muted ring-1 ring-line hover:text-ink">
            <ChevronRight aria-hidden className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
