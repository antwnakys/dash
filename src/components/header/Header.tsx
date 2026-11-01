import { useDashboard } from '@/context/DashboardContext'
import { useNow } from '@/hooks/useNow'
import { fmt, greeting } from '@/lib/date'
import { StatusBar } from './StatusBar'

export function Header() {
  const now = useNow(1000)
  const { profile } = useDashboard()
  const [hh, mm] = fmt.time.format(now).split(':')

  return (
    <header className="flex flex-col gap-6">
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">{fmt.longDate.format(now)}</p>
          <h1 className="mt-1 font-serif text-4xl leading-none tracking-tight text-ink sm:text-5xl">
            {greeting(now)}
            {profile.name && `, ${profile.name}`}
          </h1>
        </div>
        <time
          dateTime={now.toISOString()}
          aria-label={fmt.time.format(now)}
          className="font-serif text-5xl leading-none text-ink/90 tabular-nums sm:text-7xl"
        >
          {hh}
          <span className="text-faint motion-safe:animate-pulse">:</span>
          {mm}
        </time>
      </div>
      <StatusBar now={now} />
    </header>
  )
}
