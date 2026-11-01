import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSun, Snowflake, Sun, type LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { useDashboard } from '@/context/DashboardContext'
import type { Weather } from '@/types'

const icons: Record<Weather['condition'], LucideIcon> = {
  clear: Sun,
  'partly-cloudy': CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  storm: CloudLightning,
  rain: CloudRain,
  snow: Snowflake,
}

export function WeatherChip() {
  const { weather, openEditor } = useDashboard()

  if (weather.status === 'loading') return <Skeleton className="h-5 w-20 rounded-full" />
  if (weather.status === 'unavailable')
    return (
      <button onClick={() => openEditor({ type: 'settings' })} className="rounded-full px-2 py-1 text-subhead font-medium text-accent hover:bg-fill">
        Set weather
      </button>
    )

  const { data } = weather
  const Icon = icons[data.condition]
  return (
    <span
      className="flex items-center gap-1.5 px-1 text-subhead text-muted"
      title={`${data.summary}. High ${data.highC}°, low ${data.lowC}°`}
    >
      <Icon aria-hidden className="size-4" strokeWidth={2} />
      <span className="font-semibold text-ink tabular-nums">{data.tempC}°</span>
      <span className="max-w-28 truncate">{data.location}</span>
    </span>
  )
}
