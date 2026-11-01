import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { haptic } from '@/lib/native'

/** Round check with a drawn tick and a ring that pops outward when completed. */
export function Checkbox({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        if (!checked) haptic('medium')
        onToggle()
      }}
      className="relative flex size-6 shrink-0 items-center justify-center rounded-full"
    >
      <motion.span
        className={cn(
          'absolute inset-0.5 rounded-full border transition-colors duration-200',
          checked ? 'border-accent bg-accent' : 'border-line-strong hover:border-muted',
        )}
        animate={{ scale: checked ? [1, 0.82, 1] : 1 }}
        transition={{ duration: 0.3 }}
      />
      <AnimatePresence>
        {checked && (
          <motion.span
            key="burst"
            className="pointer-events-none absolute inset-0 rounded-full border border-accent"
            initial={{ scale: 0.8, opacity: 0.7 }}
            animate={{ scale: 1.9, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
      <svg viewBox="0 0 16 16" className="relative size-3.5" aria-hidden>
        <motion.path
          d="M3.5 8.5l3 3 6-7"
          fill="none"
          stroke="var(--color-accent-ink)"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: 0.25, delay: checked ? 0.08 : 0 }}
        />
      </svg>
    </button>
  )
}
