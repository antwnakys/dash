import { addDays, isSameDay, startOfDay } from './date'
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

/** Class start times on `day` from a course's weekly times, inside its term. */
function meetingsOn(course: Course, day: Date): Date[] {
  const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
  if ((course.term?.start && key < course.term.start) || (course.term?.end && key > course.term.end)) return []
  return (course.meetings ?? [])
    .filter((m) => m.days.includes(day.getDay()))
    .map((m) => {
      const [h, min] = m.start.split(':').map(Number)
      return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, min)
    })
}

/** First class of a day: from the calendar (classes at campus) and from courses' weekly times. */
function firstClass(day: Date, agenda: AgendaItem[], courses: Course[]): { title: string; at: Date } | undefined {
  const fromCalendar = agenda.filter((i) => i.kind === 'class' && !i.allDay && isSameDay(i.date, day)).map((i) => ({ title: i.title, at: i.date }))
  const fromCourses = courses.flatMap((c) => meetingsOn(c, day).map((at) => ({ title: c.name, at })))
  return [...fromCalendar, ...fromCourses].sort((a, b) => a.at.getTime() - b.at.getTime())[0]
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
