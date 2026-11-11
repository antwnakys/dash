import { useEffect } from 'react'
import { isNative } from '@/lib/native'
import { buildWidgetData, updateWidget } from '@/lib/widget'
import type { AgendaItem, Course, Profile } from '@/types'

/** Keeps the iPhone widgets' snapshot in step with the data (iPhone app only). */
export function useWidget(agenda: AgendaItem[], courses: Course[], profile: Profile) {
  const minutes = profile.commuteMinutes
  const trains = profile.suburbanTrains?.join(',')
  useEffect(() => {
    if (!isNative) return
    const push = () =>
      void updateWidget(buildWidgetData(agenda, courses, { commuteMinutes: minutes, suburbanTrains: trains ? trains.split(',') : undefined }, new Date()))
    // Shortly after the data settles (sync can change several things in a row), then every half hour and
    // whenever the app goes to the background, so the widget always has the next week ahead.
    const first = window.setTimeout(push, 1500)
    const every = window.setInterval(push, 30 * 60_000)
    const onHide = () => document.visibilityState === 'hidden' && push()
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(every)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [agenda, courses, minutes, trains])
}
