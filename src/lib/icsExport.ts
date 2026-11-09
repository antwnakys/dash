/** An .ics file of what dash itself holds (deadlines, own events and exams, dated tasks), for Apple or Google Calendar. */
import type { Assignment, CalendarEvent, Task } from '@/types'

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/[;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')
const utc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const day = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`

function event(uid: string, title: string, start: Date, end?: Date, allDay?: boolean, extra: string[] = []): string[] {
  const lines = ['BEGIN:VEVENT', `UID:${uid}@dash`, `DTSTAMP:${utc(new Date())}`, `SUMMARY:${esc(title)}`]
  if (allDay) {
    const next = new Date(start)
    next.setDate(next.getDate() + 1)
    lines.push(`DTSTART;VALUE=DATE:${day(start)}`, `DTEND;VALUE=DATE:${day(next)}`)
  } else {
    lines.push(`DTSTART:${utc(start)}`, `DTEND:${utc(end ?? new Date(start.getTime() + 30 * 60_000))}`)
  }
  return [...lines, ...extra, 'END:VEVENT']
}

export function buildIcs(assignments: Assignment[], events: CalendarEvent[], tasks: Task[], courseName: (id: string) => string | undefined): string {
  const out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//dash//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:dash']
  for (const a of assignments.filter((x) => !x.submitted))
    out.push(...event(`a-${a.id}`, `${a.kind === 'exam' ? 'Exam' : 'Due'}: ${a.title}`, new Date(a.due), undefined, false, courseName(a.courseId) ? [`DESCRIPTION:${esc(courseName(a.courseId)!)}`] : []))
  for (const e of events)
    out.push(...event(`e-${e.id}`, e.title, new Date(e.start), e.end ? new Date(e.end) : undefined, e.allDay, e.location ? [`LOCATION:${esc(e.location)}`] : []))
  for (const t of tasks.filter((x) => !x.done && x.due)) out.push(...event(`t-${t.id}`, t.title, new Date(t.due!), undefined, t.dueAllDay))
  out.push('END:VCALENDAR')
  return out.join('\r\n')
}
