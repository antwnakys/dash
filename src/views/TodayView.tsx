import { Plus, SlidersHorizontal } from 'lucide-react'
import { Agenda } from '@/components/calendar/Agenda'
import { MiniCalendar } from '@/components/calendar/MiniCalendar'
import { AppExpiryCard } from '@/components/commute/AppExpiryCard'
import { LeaveCard, OnlineCard } from '@/components/commute/LeaveCard'
import { MetroCardCard } from '@/components/commute/MetroCardCard'
import { RemindersPrompt } from '@/components/commute/RemindersPrompt'
import { DailyGoals } from '@/components/dashboard/DailyGoals'
import { DayStrip } from '@/components/dashboard/DayStrip'
import { AcademicWidget, CompletionWidget, DeadlinesWidget, StudyTimeWidget, WeekFocusWidget } from '@/components/dashboard/Widgets'
import { ExamResultPrompt } from '@/components/exams/ExamResultPrompt'
import { NextExamCard } from '@/components/exams/NextExamCard'
import { WeatherChip } from '@/components/header/WeatherChip'
import { PageHeader } from '@/components/layout/PageHeader'
import { TodayFocus } from '@/components/today/TodayFocus'
import { Button } from '@/components/ui/Button'
import { Reveal, RevealItem } from '@/components/ui/Reveal'
import { useDashboard } from '@/context/DashboardContext'
import { useNow } from '@/hooks/useNow'
import { countdown, fmt, greeting, isSameDay } from '@/lib/date'
import type { DashWidget, TodaySection } from '@/types'
import { ClassicToday } from './ClassicToday'
import { DEFAULT_WIDGETS } from '@/lib/dashboard'



const widgets: Record<DashWidget, (props: { now: Date }) => React.ReactNode> = {
  study: StudyTimeWidget,
  completion: CompletionWidget,
  weekfocus: WeekFocusWidget,
  deadlines: DeadlinesWidget,
}

/** One calm sentence about the day, built from what's actually scheduled. */
function useSummary(now: Date) {
  const { agenda, tasks } = useDashboard()
  const leftToday = agenda.filter((i) => isSameDay(i.date, now) && (i.allDay || i.date >= now)).length
  const open = tasks.tasks.filter((t) => !t.done).length
  const deadline = agenda.find((i) => (i.kind === 'assignment' || i.kind === 'exam' || i.kind === 'quiz' || i.kind === 'task') && i.date > now)
  const first = leftToday === 0 ? 'Nothing else on today' : `${leftToday} more ${leftToday === 1 ? 'thing' : 'things'} today`
  const second = open === 0 ? 'no open tasks' : `${open} open ${open === 1 ? 'task' : 'tasks'}`
  return (
    <>
      {first}, {second}.
      {deadline && (
        <>
          {' '}
          Next due: <span className="text-ink">{deadline.title}</span>, {countdown(deadline.date, now)}.
        </>
      )}
    </>
  )
}

/** Obsidian's command centre; the Classic design keeps the original Today page. */
export function TodayView() {
  const { theme } = useDashboard()
  return theme.look.resolved === 'classic' ? <ClassicToday /> : <Dashboard />
}

function Dashboard() {
  const { profile, setPalette, openEditor } = useDashboard()
  const now = useNow(1000)
  const summary = useSummary(now)
  const show = (s: TodaySection) => !profile.todayHidden?.includes(s)
  const order = [...(profile.widgetOrder ?? []), ...DEFAULT_WIDGETS].filter((w, i, a) => a.indexOf(w) === i && DEFAULT_WIDGETS.includes(w))
  const shown = order.filter(show)

  return (
    <Reveal id="today">
      <PageHeader
        shortTitle="Today"
        eyebrow={
          <>
            {fmt.longDate.format(now)} · <span className="tabular-nums">{fmt.time.format(now)}</span>
          </>
        }
        accessory={<WeatherChip />}
        title={
          <>
            {greeting(now)}
            {profile.name && `, ${profile.name}`}
          </>
        }
        aside={
          <div className="flex items-center gap-2">
            {/* Quick add is used every day; Customise now and then, so it's the quieter one. */}
            <Button size="sm" variant="primary" onClick={() => setPalette(true)}>
              <Plus aria-hidden className="size-4" strokeWidth={2.4} />
              Quick add
            </Button>
            <Button size="sm" onClick={() => openEditor({ type: 'settings', section: 'today' })}>
              <SlidersHorizontal aria-hidden className="size-4" strokeWidth={2.2} />
              Customise
            </Button>
          </div>
        }
        summary={summary}
      />

      <div className="flex flex-col gap-4">
        <RevealItem className="grid gap-3 empty:hidden md:grid-cols-2 [&>*:only-child]:md:col-span-2">
          <AppExpiryCard />
          <RemindersPrompt />
          <MetroCardCard />
          <OnlineCard />
          <LeaveCard />
          <ExamResultPrompt />
          <NextExamCard />
        </RevealItem>
        {show('goals') && (
          <RevealItem>
            <DailyGoals now={now} />
          </RevealItem>
        )}
        {shown.length > 0 && (
          // On phones the wide boxes (week bars, deadlines) take a whole row; dense packing fills any gap.
          <RevealItem className="grid grid-flow-row-dense grid-cols-2 gap-3 xl:grid-cols-4">
            {shown.map((w) => {
              const W = widgets[w]
              return <W key={w} now={now} />
            })}
          </RevealItem>
        )}
        {show('timeline') && (
          <RevealItem>
            <DayStrip now={now} />
          </RevealItem>
        )}
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-8">
            {show('focus') && (
              <RevealItem>
                <TodayFocus now={now} />
              </RevealItem>
            )}
            {show('upnext') && (
              <RevealItem>
                <Agenda limit={6} />
              </RevealItem>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-8">
            {show('academic') && (
              <RevealItem className="empty:hidden">
                <AcademicWidget />
              </RevealItem>
            )}
            {show('calendar') && (
              <RevealItem>
                <MiniCalendar />
              </RevealItem>
            )}
          </div>
        </div>
      </div>
    </Reveal>
  )
}
