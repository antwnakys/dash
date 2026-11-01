import type { CalendarEvent } from '@/types'

/** Parse an ICS DATE or DATE-TIME value. Floating and TZID times are read as local. */
function parseIcsDate(value: string): { date: Date; allDay: boolean } | null {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/)
  if (!m) return null
  const [, y, mo, d, h, mi, s, z] = m
  if (h === undefined) return { date: new Date(+y, +mo - 1, +d), allDay: true }
  const date = z
    ? new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +(s ?? 0)))
    : new Date(+y, +mo - 1, +d, +h, +mi, +(s ?? 0))
  return { date, allDay: false }
}

const unescape = (v: string) => v.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1').trim()

/**
 * Events from an .ics file (Google Calendar export, a school/LMS calendar feed…).
 * Keeps events from a week ago to a year ahead; recurring events count once.
 */
export function parseIcs(text: string): CalendarEvent[] {
  const lines = text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/)
  const from = Date.now() - 7 * 86_400_000
  const to = Date.now() + 365 * 86_400_000
  const out: CalendarEvent[] = []
  let cur: Record<string, string> | null = null

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') cur = {}
    else if (line === 'END:VEVENT' && cur) {
      const start = cur.DTSTART ? parseIcsDate(cur.DTSTART) : null
      if (start && cur.SUMMARY && start.date.getTime() >= from && start.date.getTime() <= to) {
        out.push({
          id: `ics-${cur.UID ?? `${cur.SUMMARY}-${cur.DTSTART}`}`,
          title: unescape(cur.SUMMARY),
          start: start.date.toISOString(),
          allDay: start.allDay || undefined,
          location: cur.LOCATION ? unescape(cur.LOCATION) || undefined : undefined,
          kind: 'event',
        })
      }
      cur = null
    } else if (cur) {
      const i = line.indexOf(':')
      if (i < 0) continue
      const key = line.slice(0, i).split(';')[0].toUpperCase()
      if (!(key in cur)) cur[key] = line.slice(i + 1)
    }
  }
  return out
}
