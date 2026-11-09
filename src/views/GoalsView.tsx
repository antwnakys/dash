import { Minus, Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Reveal, RevealItem } from '@/components/ui/Reveal'
import { Card, Section } from '@/components/ui/Section'
import { useDashboard } from '@/context/DashboardContext'
import { useNow } from '@/hooks/useNow'
import { cn } from '@/lib/cn'
import { goalProgress, goalUnit, periodKey, periodLabel } from '@/lib/goals'
import type { Goal } from '@/types'

const ORDER: Goal['period'][] = ['day', 'week', 'term']

/** Goals for today, this week and this term, with progress counted from what you actually do. */
export function GoalsView() {
  const { goals, tasks, focusSessions, openEditor } = useDashboard()
  const now = useNow(60_000)
  const rows = goals.items.map((g) => {
    const value = goalProgress(g, now, tasks.tasks, focusSessions.items)
    return { goal: g, value, pct: Math.min(1, value / g.target) }
  })
  const met = rows.filter((r) => r.pct >= 1).length

  const bump = (g: Goal, by: number) => {
    const key = periodKey(g.period, now)
    goals.update(g.id, { counts: { ...g.counts, [key]: Math.max(0, (g.counts?.[key] ?? 0) + by) } })
  }

  return (
    <Reveal id="goals">
      <PageHeader
        shortTitle="Goals"
        eyebrow="What you're aiming for"
        title="Goals"
        aside={
          <Button variant="primary" onClick={() => openEditor({ type: 'goal' })}>
            <Plus aria-hidden className="size-4" strokeWidth={2.4} />
            New goal
          </Button>
        }
        summary={rows.length > 0 && `${met} of ${rows.length} met. Tasks and focus time count by themselves.`}
      />
      {rows.length === 0 ? (
        <RevealItem>
          <Card>
            <EmptyState message="No goals yet. Try “Study 10 hours this week” (counts your focus time) or “Finish 3 college tasks today”.">
              <Button size="sm" variant="primary" onClick={() => openEditor({ type: 'goal' })}>
                New goal
              </Button>
            </EmptyState>
          </Card>
        </RevealItem>
      ) : (
        <div className="flex flex-col gap-8">
          {ORDER.map((period) => {
            const list = rows.filter((r) => r.goal.period === period)
            if (!list.length) return null
            return (
              <RevealItem key={period}>
                <Section title={periodLabel[period]}>
                  <Card>
                    <ul className="separated">
                      {list.map(({ goal, value, pct }) => (
                        <li key={goal.id} className="flex items-center gap-4 px-4 py-3.5">
                          <button onClick={() => openEditor({ type: 'goal', id: goal.id })} className="min-w-0 flex-1 text-left">
                            <span className="flex items-baseline justify-between gap-3">
                              <span className="truncate text-body text-ink">{goal.title}</span>
                              <span className={cn('shrink-0 text-subhead tabular-nums', pct >= 1 ? 'font-semibold text-course' : 'text-muted')}>
                                {goalUnit(goal, value)} / {goalUnit(goal, goal.target)}
                              </span>
                            </span>
                            <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-fill-strong">
                              <span className={cn('block h-full rounded-full transition-[width] duration-500', pct >= 1 ? 'bg-course' : 'bg-ink/75')} style={{ width: `${pct * 100}%` }} />
                            </span>
                            <span className="mt-1.5 block text-caption text-muted">
                              {goal.area === 'academic' ? 'Academic' : 'Personal'} · {goal.metric === 'focus' ? 'counts focus time' : goal.metric === 'tasks' ? 'counts tasks done' : 'counted by hand'}
                            </span>
                          </button>
                          {goal.metric === 'manual' && (
                            <span className="flex shrink-0 gap-1">
                              <button onClick={() => bump(goal, -1)} aria-label={`One less for ${goal.title}`} className="flex size-8 items-center justify-center rounded-full bg-fill text-muted hover:text-ink">
                                <Minus aria-hidden className="size-4" />
                              </button>
                              <button onClick={() => bump(goal, 1)} aria-label={`One more for ${goal.title}`} className="flex size-8 items-center justify-center rounded-full bg-accent-fill text-accent-ink">
                                <Plus aria-hidden className="size-4" />
                              </button>
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </Section>
              </RevealItem>
            )
          })}
        </div>
      )}
    </Reveal>
  )
}
