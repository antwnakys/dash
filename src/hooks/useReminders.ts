import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_COMMUTE } from '@/lib/commute'
import { applyReminders, askForReminders, planReminders, reminderPermission, sendTestReminder, type ReminderPermission } from '@/lib/reminders'
import type { AgendaItem, Course, Profile } from '@/types'

export interface RemindersState {
  permission: ReminderPermission
  /** How many reminders are lined up for the next two weeks. */
  scheduled: number
  enable: () => Promise<void>
  /** Sends a notification in 5 seconds (asks for permission first if needed). */
  test: () => Promise<void>
}

/** Keeps the phone's scheduled reminders in step with dash's data (iPhone app only). */
export function useReminders(agenda: AgendaItem[], courses: Course[], profile: Profile): RemindersState {
  const [permission, setPermission] = useState<ReminderPermission>('unavailable')
  const [scheduled, setScheduled] = useState(0)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    reminderPermission().then(setPermission, () => setPermission('unavailable'))
  }, [])

  const commute = profile.commuteMinutes ?? DEFAULT_COMMUTE
  const leave = profile.reminders?.leave
  const deadlines = profile.reminders?.deadlines
  const metroCard = profile.reminders?.metroCard
  const trains = profile.suburbanTrains?.join(',')

  // Rebuild shortly after the data settles (sync can change several things in a row).
  useEffect(() => {
    if (permission !== 'granted') return
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const plan = planReminders({ agenda, courses, commuteMinutes: commute, trains: trains ? trains.split(',') : undefined, prefs: { leave, deadlines, metroCard }, now: new Date() })
      applyReminders(plan).then(() => setScheduled(plan.length), () => {})
    }, 1500)
    return () => window.clearTimeout(timer.current)
  }, [permission, agenda, courses, commute, trains, leave, deadlines, metroCard])

  const enable = useCallback(async () => {
    setPermission(await askForReminders())
  }, [])

  const test = useCallback(async () => {
    const granted = permission === 'granted' ? 'granted' : await askForReminders()
    setPermission(granted)
    if (granted === 'granted') await sendTestReminder()
  }, [permission])

  return { permission, scheduled, enable, test }
}
