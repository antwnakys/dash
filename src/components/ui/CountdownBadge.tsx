import { cn } from '@/lib/cn'
import { countdown, dayDiff } from '@/lib/date'

/** "in 2 days" pill; turns accent when the date is within a day. */
export function CountdownBadge({ date, now, className }: { date: Date; now: Date; className?: string }) {
  const soon = dayDiff(now, date) <= 1
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        soon ? 'bg-accent/15 text-accent' : 'bg-white/[0.04] text-muted',
        className,
      )}
    >
      {countdown(date, now)}
    </span>
  )
}
