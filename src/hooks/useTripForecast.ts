import { useEffect, useState } from 'react'
import { fetchHourly, type HourlyPoint } from '@/data/weather'
import type { Place } from '@/types'

const KEY = 'dash.tripweather.v1'
const MAX_AGE = 30 * 60_000

interface Forecast {
  home: HourlyPoint[]
  campus: HourlyPoint[]
}

const placesKey = (home?: Place, campus?: Place) => [home, campus].map((p) => (p ? `${p.latitude},${p.longitude}` : '')).join('|')

function cached(places: string): Forecast | undefined {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { at: number; places?: string; data: Forecast } | null
    return c && c.places === places && Date.now() - c.at < MAX_AGE ? c.data : undefined
  } catch {
    return undefined
  }
}

/**
 * Hourly forecast for home and campus (the places saved in Settings), fetched only while a trip is coming up;
 * cached for 30 minutes. Nothing until both places are set.
 */
export function useTripForecast(active: boolean, home?: Place, campus?: Place): Forecast | undefined {
  const places = placesKey(home, campus)
  const [fetched, setFetched] = useState<{ places: string; data: Forecast }>()

  useEffect(() => {
    if (!active || !home || !campus || cached(places)) return
    let cancelled = false
    fetchHourly([home, campus])
      .then(([h, c]) => {
        if (cancelled || !h || !c) return
        const data = { home: h, campus: c }
        try {
          localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), places, data }))
        } catch {
          // Cache is optional.
        }
        setFetched({ places, data })
      })
      .catch(() => {
        // No hint when offline; the card works without it.
      })
    return () => {
      cancelled = true
    }
  }, [active, home, campus, places])

  if (!active || !home || !campus) return undefined
  return fetched?.places === places ? fetched.data : cached(places)
}
