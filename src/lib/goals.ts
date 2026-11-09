/** Goal progress from real data: tasks ticked and focus minutes in the goal's period, or a hand count. */
import { startOfDay, weekOf } from './date'
import type { FocusSession, Goal, Task } from '@/types'

/** "2026-11-09", "2026-W46" (Monday-based) or "term". */
export function periodKey(period: Goal['period'], now: Date): string {
  if (period === 'term') return 'term'
  if (period === 'day') return startOfDay(now).toISOString().slice(0, 10)
  const monday = weekOf(now)[0]
  return `W-${monday.toISOString().slice(0, 10)}`
}

export function periodStart(period: Goal['period'], now: Date, createdAt: string): Date {
  if (period === 'day') return startOfDay(now)
  if (period === 'week') return weekOf(now)[0]
  return new Date(createdAt)
}

export function goalProgress(goal: Goal, now: Date, tasks: Task[], sessions: FocusSession[]): number {
  if (goal.metric === 'manual') return goal.counts?.[periodKey(goal.period, now)] ?? 0
  const from = periodStart(goal.period, now, goal.createdAt)
  if (goal.metric === 'focus') return sessions.filter((s) => new Date(s.start) >= from).reduce((n, s) => n + s.minutes, 0)
  return tasks.filter((t) => t.done && t.completedAt && new Date(t.completedAt) >= from && (!goal.category || t.category === goal.category)).length
}

export const periodLabel: Record<Goal['period'], string> = { day: 'Today', week: 'This week', term: 'This term' }

export function goalUnit(goal: Goal, n: number): string {
  if (goal.metric === 'focus') return n < 60 ? `${n} min` : `${Math.floor(n / 60)} h${n % 60 ? ` ${n % 60} min` : ''}`
  if (goal.metric === 'tasks') return `${n} ${n === 1 ? 'task' : 'tasks'}`
  return String(n)
}
