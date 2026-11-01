import { motion } from 'framer-motion'
import { useId } from 'react'
import { cn } from '@/lib/cn'

interface SegmentedProps<T extends string> {
  label: string
  options: ReadonlyArray<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
  className?: string
}

/** Pill toggle whose highlight glides between options. */
export function Segmented<T extends string>({ label, options, value, onChange, className }: SegmentedProps<T>) {
  const layoutId = useId()
  return (
    <div role="radiogroup" aria-label={label} className={cn('flex rounded-full bg-white/[0.04] p-0.5', className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors',
              active ? 'text-ink' : 'text-muted hover:text-ink',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-white/[0.09]"
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
