import { classesOn } from './classes'
import { addDays, startOfDay } from './date'
import type { AgendaItem, Course } from '@/types'

/**
 * Home (Argyroupoli) to campus (Sorou 74, Marousi): walk 10–12 min, metro Line 2 to Syntagma,
 * Line 3 to Doukissis Plakentias, suburban one stop to Pentelis, walk ~8 min. About 80 minutes,
 * most of the spread being the wait for the suburban train.
 */
export const DEFAULT_COMMUTE = 80
export const COMMUTE_ROUTE = 'Walk to Argyroupoli · metro to Doukissis Plakentias · suburban to Pentelis · walk'

export interface Departure {
  title: string
  classAt: Date
  leaveAt: Date
  tomorrow: boolean
}

// From this hour the evening before, tomorrow's first class is shown.
const EVENING = 17

/** First class of a day. */
function firstClass(day: Date, agenda: AgendaItem[], courses: Course[]): { title: string; at: Date } | undefined {
  // Online lessons are taken from home, so only classes on campus need the trip.
  const first = classesOn(day, agenda, courses).find((c) => !c.online)
  return first && { title: first.title, at: first.start }
}

/**
 * When to leave home for the first class of the day. Once that class has started you're on campus,
 * so later classes don't count; in the evening it looks ahead to tomorrow's first class.
 */
export function nextDeparture(agenda: AgendaItem[], courses: Course[], now: Date, minutes: number): Departure | undefined {
  const today = firstClass(startOfDay(now), agenda, courses)
  const pick = today && today.at > now ? { ...today, tomorrow: false } : undefined
  const next = pick ?? (now.getHours() >= EVENING ? firstClass(addDays(startOfDay(now), 1), agenda, courses) : undefined)
  if (!next) return undefined
  return {
    title: next.title,
    classAt: next.at,
    leaveAt: new Date(next.at.getTime() - minutes * 60_000),
    tomorrow: !pick,
  }
}
