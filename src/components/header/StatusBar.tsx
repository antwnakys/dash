import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSun, Snowflake, Sun, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { useDashboard } from '@/context/DashboardContext'
import { countdown, isSameDay } from '@/lib/date'
import type { WeatherState } from '@/hooks/useWeather'
import type { Weather } from '@/types'

const weatherIcon: Record<Weather['condition'], LucideIcon> = {
  clear: Sun,
  'partly-cloudy': CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  storm: CloudLightning,
  rain: CloudRain,
  snow: Snowflake,
}

function Item({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-0.5 border-line px-4 py-3 sm:px-5', className)}>
      <span className="text-xs text-faint">{label}</span>
      <span className="truncate text-sm text-ink">{children}</span>
    </div>
  )
}

function WeatherReading({ weather, onSetLocation }: { weather: WeatherState; onSetLocation: () => void }) {
  if (weather.status === 'loading') return <span className="text-faint">Checking…</span>
  if (weather.status === 'unavailable')
    return (
      <button onClick={onSetLocation} className="text-accent hover:underline">
        Set your city
      </button>
    )
  const Icon = weatherIcon[weather.data.condition]
  return (
    <span className="inline-flex items-center gap-1.5" title={`High ${weather.data.highC}°, low ${weather.data.lowC}°`}>
      <Icon aria-hidden className="size-4 text-accent" strokeWidth={1.75} />
      {weather.data.tempC}° <span className="text-muted">{weather.data.summary.toLowerCase()}</span>
    </span>
  )
}

export function StatusBar({ now }: { now: Date }) {
  const { weather, agenda, tasks, openEditor } = useDashboard()

  const nextDeadline = agenda.find((i) => ['assignment', 'exam', 'quiz'].includes(i.kind) && i.date > now)
  const today = agenda.filter((i) => isSameDay(i.date, now) && i.date >= now)
  const openTasks = tasks.tasks.filter((t) => !t.done).length

  return (
    <div className="glass grid grid-cols-2 overflow-hidden rounded-2xl sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]">
      <Item label={weather.status === 'ready' ? weather.data.location : 'Weather'} className="border-r border-b sm:border-b-0">
        <WeatherReading weather={weather} onSetLocation={() => openEditor({ type: 'settings' })} />
      </Item>
      <Item label="Next deadline" className="border-b sm:border-r sm:border-b-0">
        {nextDeadline ? (
          <>
            {nextDeadline.title} <span className="text-accent">{countdown(nextDeadline.date, now)}</span>
          </>
        ) : (
          <span className="text-muted">Nothing due</span>
        )}
      </Item>
      <Item label="Still today" className="border-r">
        {today.length ? `${today.length} ${today.length === 1 ? 'thing' : 'things'}` : <span className="text-muted">Free evening</span>}
      </Item>
      <Item label="Open tasks">{openTasks}</Item>
    </div>
  )
}
