/** What dash reminds you about, worked out from your data. No phone APIs here, so it can be tested anywhere. */
import type { AgendaItem, Course, Profile } from '@/types'
import { CAMPUS } from './campus'
import { classesOn } from './classes'
import { addDays, fmt, startOfDay } from './date'

export interface Reminder {
  id: number
  at: Date
  title: string
  body: string
}

const DAYS = 14
const MAX = 60
const LEAVE_HEADS_UP = 10 // minutes before it's time to leave
const DUE_SOON_HOURS = 3
const EVENING_BEFORE = 20 // 20:00 the day before

const kindName = { assignment: 'Due', exam: 'Exam', quiz: 'Quiz' } as const

/** What to remind about in the next two weeks, soonest first. Pure, so it can be tested. */
export function planReminders(input: {
  agenda: AgendaItem[]
  courses: Course[]
  commuteMinutes: number
  prefs: NonNullable<Profile['reminders']>
  now: Date
}): Reminder[] {
  const { agenda, courses, commuteMinutes, prefs, now } = input
  const out: Omit<Reminder, 'id'>[] = []
  const until = addDays(startOfDay(now), DAYS)

  if (prefs.leave !== false) {
    for (let i = 0; i < DAYS; i++) {
      const first = classesOn(addDays(startOfDay(now), i), agenda, courses)[0]
      if (!first) continue
      const at = new Date(first.start.getTime() - (commuteMinutes + LEAVE_HEADS_UP) * 60_000)
      if (at > now)
        out.push({
          at,
          title: `Leave in ${LEAVE_HEADS_UP} min`,
          body: `${first.title} at ${fmt.time.format(first.start)} · ${CAMPUS.split(',')[0]}`,
        })
    }
  }

  if (prefs.deadlines !== false) {
    for (const item of agenda) {
      if (item.kind !== 'assignment' && item.kind !== 'exam' && item.kind !== 'quiz') continue
      if (item.date <= now || item.date > until) continue
      const label = kindName[item.kind]
      const where = item.context ? ` · ${item.context}` : ''
      const evening = addDays(startOfDay(item.date), -1)
      evening.setHours(EVENING_BEFORE, 0, 0, 0)
      if (evening > now)
        out.push({
          at: evening,
          title: item.kind === 'assignment' ? `Due tomorrow: ${item.title}` : `${label} tomorrow: ${item.title}`,
          body: `${item.allDay ? 'All day' : fmt.time.format(item.date)}${where}`,
        })
      const soon = new Date(item.date.getTime() - DUE_SOON_HOURS * 3_600_000)
      if (!item.allDay && soon > now && soon > evening)
        out.push({
          at: soon,
          title: item.kind === 'assignment' ? `Due in ${DUE_SOON_HOURS} hours: ${item.title}` : `${label} in ${DUE_SOON_HOURS} hours: ${item.title}`,
          body: `${fmt.time.format(item.date)}${where}`,
        })
    }
  }

  return out
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, MAX)
    .map((r, i) => ({ ...r, id: i + 1 }))
}

