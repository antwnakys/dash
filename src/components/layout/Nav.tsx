import { motion } from 'framer-motion'
import { Settings } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { useDashboard } from '@/context/DashboardContext'
import { cn } from '@/lib/cn'
import { haptic } from '@/lib/native'
import { views, type ViewId } from '@/views'

interface NavProps {
  active: ViewId
  onChange: (id: ViewId) => void
}

const item =
  'group relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 transition-colors lg:size-11 lg:flex-none lg:justify-center lg:p-0'

function Tooltip({ label }: { label: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-full ml-3 rounded-md bg-raised px-2 py-1 text-xs whitespace-nowrap text-ink opacity-0 transition-opacity max-lg:hidden lg:group-hover:opacity-100"
    >
      {label}
    </span>
  )
}

/** Icon rail on large screens, bottom tab bar on small ones. */
export function Nav({ active, onChange }: NavProps) {
  const { openEditor } = useDashboard()

  return (
    <nav
      aria-label="Sections"
      className={cn(
        'glass fixed z-20 flex',
        'inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] justify-around rounded-2xl p-1.5',
        'lg:inset-x-auto lg:top-1/2 lg:bottom-auto lg:left-5 lg:-translate-y-1/2 lg:flex-col lg:gap-1',
      )}
    >
      <Logo className="mx-auto mt-1 mb-3 size-8 max-lg:hidden" />
      {views.map(({ id, label, icon: Icon }) => {
        const isActive = id === active
        return (
          <button
            key={id}
            onClick={() => {
              if (!isActive) haptic()
              onChange(id)
            }}
            aria-current={isActive ? 'page' : undefined}
            className={cn(item, isActive ? 'text-ink' : 'text-faint hover:text-muted')}
          >
            {isActive && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 rounded-xl bg-white/[0.07]"
                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              />
            )}
            <Icon aria-hidden className={cn('relative size-5', isActive && 'text-accent')} strokeWidth={1.75} />
            <span className="relative text-[10px] lg:sr-only">{label}</span>
            <Tooltip label={label} />
          </button>
        )
      })}
      <button onClick={() => openEditor({ type: 'settings' })} className={cn(item, 'text-faint hover:text-muted lg:mt-3')}>
        <Settings aria-hidden className="relative size-5" strokeWidth={1.75} />
        <span className="relative text-[10px] lg:sr-only">Settings</span>
        <Tooltip label="Settings" />
      </button>
    </nav>
  )
}
