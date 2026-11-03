/**
 * Phone reminders, scheduled with iOS as local notifications so they arrive even when dash is closed.
 * Every time the data changes the whole plan is rebuilt: everything dash scheduled is cancelled and
 * the next two weeks are scheduled again (iOS keeps at most 64 pending, dash uses up to 60).
 */
import { LocalNotifications } from '@capacitor/local-notifications'
import { isNative } from './native'
import type { Reminder } from './reminderPlan'

export { planReminders } from './reminderPlan'

export type ReminderPermission = 'granted' | 'denied' | 'prompt' | 'unavailable'

export async function reminderPermission(): Promise<ReminderPermission> {
  if (!isNative) return 'unavailable'
  const { display } = await LocalNotifications.checkPermissions()
  return display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'prompt'
}

/** Shows the iOS "Allow notifications?" prompt (only the first time; afterwards iOS answers itself). */
export async function askForReminders(): Promise<ReminderPermission> {
  if (!isNative) return 'unavailable'
  const { display } = await LocalNotifications.requestPermissions()
  return display === 'granted' ? 'granted' : 'denied'
}

const TEST_ID = 9999

/** A notification 5 seconds from now, to check reminders reach the phone. */
export async function sendTestReminder(): Promise<void> {
  if (!isNative) return
  await LocalNotifications.schedule({
    notifications: [{ id: TEST_ID, title: 'dash reminders work', body: 'This is what a reminder looks like.', schedule: { at: new Date(Date.now() + 5000) } }],
  })
}

/** Replaces everything dash has scheduled with `plan`. */
export async function applyReminders(plan: Reminder[]): Promise<void> {
  if (!isNative) return
  // The test notification is left alone, so a sync right after tapping the button doesn't cancel it.
  const { notifications } = await LocalNotifications.getPending()
  const ours = notifications.filter((n) => n.id !== TEST_ID)
  if (ours.length) await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) })
  if (plan.length)
    await LocalNotifications.schedule({
      notifications: plan.map((r) => ({ id: r.id, title: r.title, body: r.body, schedule: { at: r.at, allowWhileIdle: true } })),
    })
}
