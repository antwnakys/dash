import { useCallback, useEffect, useRef, useState } from 'react'
import { parseIcs } from '@/lib/ics'
import { isNative } from '@/lib/native'
import type { CalendarEvent } from '@/types'
import { useLocalStorage } from './useLocalStorage'

const DAY_MS = 86_400_000
const EVERY = 15 * 60_000

export interface CalendarSync {
  events: CalendarEvent[]
  status: 'off' | 'syncing' | 'ok' | 'error'
  syncedAt?: string
  error?: string
  sync: () => void
}

interface Snapshot {
  events: CalendarEvent[]
  syncedAt: string
}

const normalize = (url: string) => url.trim().replace(/^webcal:\/\//i, 'https://')

async function fetchFeed(url: string, index: number): Promise<CalendarEvent[]> {
  // In the iOS app fetch goes through native HTTP (CapacitorHttp), so Google's missing CORS headers don't matter.
  const res = await fetch(normalize(url), { cache: 'no-store' })
  if (!res.ok) throw new Error(`Calendar returned ${res.status}. Check that the address is the full secret iCal link.`)
  const text = await res.text()
  if (!text.includes('BEGIN:VCALENDAR')) throw new Error('That address didn’t return a calendar. Copy the “Secret address in iCal format”.')
  return parseIcs(text, { from: Date.now() - DAY_MS, to: Date.now() + 180 * DAY_MS, idPrefix: `cal${index}` })
}

/** Keeps a read-only copy of the user's calendars, refreshed on launch, every 15 minutes and on return to the app. */
export function useCalendarSync(urls: string[] = []): CalendarSync {
  const [snapshot, setSnapshot] = useLocalStorage<Snapshot>('dash.calendar.v1')
  const [status, setStatus] = useState<CalendarSync['status']>(urls.length ? 'ok' : 'off')
  const [error, setError] = useState<string>()
  const key = urls.join('\n')
  const running = useRef(false)

  const sync = useCallback(async () => {
    const list = key.split('\n').filter(Boolean)
    if (!list.length || running.current) return
    running.current = true
    setStatus('syncing')
    try {
      const feeds = await Promise.all(list.map(fetchFeed))
      const seen = new Set<string>()
      const events = feeds.flat().filter((e) => !seen.has(e.id) && seen.add(e.id))
      setSnapshot({ events, syncedAt: new Date().toISOString() })
      setStatus('ok')
      setError(undefined)
    } catch (e) {
      setStatus('error')
      setError(
        e instanceof TypeError && !isNative
          ? 'Browsers can’t read Google Calendar directly. Sync runs in the dash iPhone app.'
          : e instanceof Error
            ? e.message
            : String(e),
      )
    } finally {
      running.current = false
    }
  }, [key, setSnapshot])

  useEffect(() => {
    if (!key) return
    sync()
    const timer = window.setInterval(sync, EVERY)
    const onVisible = () => document.visibilityState === 'visible' && sync()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [key, sync])

  if (!key) return { events: [], status: 'off', sync }
  return { events: snapshot?.events ?? [], status, syncedAt: snapshot?.syncedAt, error, sync }
}
