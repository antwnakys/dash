import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Panel } from '@/components/ui/Panel'
import { Segmented } from '@/components/ui/Segmented'
import { useDashboard } from '@/context/DashboardContext'
import { useNow } from '@/hooks/useNow'
import { cn } from '@/lib/cn'
import { addDays, addMonths, fmt, isSameDay, monthGrid, startOfDay, weekOf } from '@/lib/date'

type Mode = 'month' | 'week'

const modes = [
  { value: 'month' as const, label: 'Month' },
  { value: 'week' as const, label: 'Week' },
]

const dayKey = (d: Date) => startOfDay(d).toDateString()

export function MiniCalendar() {
  const { agenda, selectedDate, setSelectedDate } = useDashboard()
  const [mode, setMode] = useState<Mode>('month')
  const [cursor, setCursor] = useState(selectedDate)
  const [direction, setDirection] = useState(0)
  const today = startOfDay(useNow(60_000))

  const days = mode === 'month' ? monthGrid(cursor) : weekOf(cursor)

  // Per day: how many items, and whether any is an exam (shown in accent).
  const marks = useMemo(() => {
    const m = new Map<string, { count: number; exam: boolean }>()
    for (const item of agenda) {
      const k = dayKey(item.date)
      const prev = m.get(k) ?? { count: 0, exam: false }
      m.set(k, { count: prev.count + 1, exam: prev.exam || item.kind === 'exam' })
    }
    return m
  }, [agenda])

  const step = (dir: 1 | -1) => {
    setDirection(dir)
    setCursor((c) => (mode === 'month' ? addMonths(c, dir) : addDays(c, dir * 7)))
  }

  const select = (d: Date) => {
    setSelectedDate(d)
    if (mode === 'month' && d.getMonth() !== cursor.getMonth()) {
      setDirection(d < cursor ? -1 : 1)
      setCursor(d)
    }
  }

  const goToday = () => {
    setDirection(today < cursor ? -1 : 1)
    setCursor(today)
    setSelectedDate(today)
  }

  return (
    <Panel
      title={fmt.monthYear.format(mode === 'week' ? days[3] : cursor)}
      action={<Segmented label="Calendar view" options={modes} value={mode} onChange={setMode} />}
    >
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={goToday}
          className="rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-white/[0.06] hover:text-ink"
        >
          Today
        </button>
        <div className="flex">
          <button
            onClick={() => step(-1)}
            aria-label={mode === 'month' ? 'Previous month' : 'Previous week'}
            className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-white/[0.06] hover:text-ink"
          >
            <ChevronLeft aria-hidden className="size-4" />
          </button>
          <button
            onClick={() => step(1)}
            aria-label={mode === 'month' ? 'Next month' : 'Next week'}
            className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-white/[0.06] hover:text-ink"
          >
            <ChevronRight aria-hidden className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 pb-1 text-center text-[11px] text-faint">
        {weekOf(today).map((d) => (
          <span key={d.getDay()}>{fmt.weekdayShort.format(d).slice(0, 2)}</span>
        ))}
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={`${mode}-${dayKey(days[0])}`}
            custom={direction}
            variants={{
              enter: (dir: number) => ({ x: dir * 24, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (dir: number) => ({ x: dir * -24, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-7 gap-y-0.5"
          >
            {days.map((d) => {
              const mark = marks.get(dayKey(d))
              const isToday = isSameDay(d, today)
              const selected = isSameDay(d, selectedDate)
              const outside = mode === 'month' && d.getMonth() !== cursor.getMonth()
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => select(d)}
                  aria-pressed={selected}
                  aria-label={`${fmt.longDate.format(d)}${mark ? `, ${mark.count} scheduled` : ''}`}
                  className={cn(
                    'relative mx-auto flex flex-col items-center justify-center rounded-xl text-sm tabular-nums transition-colors',
                    mode === 'week' ? 'h-14 w-full max-w-11' : 'size-10',
                    selected ? 'bg-accent font-semibold text-accent-ink' : 'hover:bg-white/[0.05]',
                    !selected && (outside ? 'text-faint/60' : 'text-ink/90'),
                    !selected && isToday && 'text-accent ring-1 ring-accent/50 ring-inset',
                  )}
                >
                  {d.getDate()}
                  <span className="absolute bottom-1.5 flex gap-0.5">
                    {mark &&
                      Array.from({ length: Math.min(mark.count, 3) }, (_, i) => (
                        <span
                          key={i}
                          className={cn(
                            'size-1 rounded-full',
                            selected ? 'bg-accent-ink/70' : mark.exam && i === 0 ? 'bg-accent' : 'bg-muted/70',
                          )}
                        />
                      ))}
                  </span>
                </button>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </Panel>
  )
}
