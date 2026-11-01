import { useEffect, useState } from 'react'
import { currentPosition, fetchWeather } from '@/data/weather'
import type { Place, Weather } from '@/types'

export type WeatherState =
  | { status: 'loading' }
  | { status: 'ready'; data: Weather }
  | { status: 'unavailable'; reason: string }

const CACHE_KEY = 'dash.weather.v1'
const MAX_AGE = 30 * 60_000

interface Cached {
  at: number
  key: string
  data: Weather
}

const placeKey = (p?: Place) => (p ? `${p.latitude.toFixed(2)},${p.longitude.toFixed(2)}` : 'device')

function readCache(key: string): Weather | undefined {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as Cached | null
    return c && c.key === key && Date.now() - c.at < MAX_AGE ? c.data : undefined
  } catch {
    return undefined
  }
}

/** Weather for the chosen place, or the device location when none is set. */
export function useWeather(place?: Place): WeatherState {
  const key = placeKey(place)
  const [state, setState] = useState<WeatherState>(() => {
    const cached = readCache(key)
    return cached ? { status: 'ready', data: cached } : { status: 'loading' }
  })

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const cached = readCache(key)
      if (cached) return setState({ status: 'ready', data: cached })
      try {
        const data = await fetchWeather(place ?? (await currentPosition()))
        if (cancelled) return
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), key, data } satisfies Cached))
        } catch {
          // Cache is optional.
        }
        setState({ status: 'ready', data })
      } catch (e) {
        if (!cancelled) setState({ status: 'unavailable', reason: e instanceof Error ? e.message : String(e) })
      }
    }
    load()
    const timer = window.setInterval(load, MAX_AGE)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
    // `key` captures every change of `place` that matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return state
}
