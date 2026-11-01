import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useDashboard } from '@/context/DashboardContext'
import { cn } from '@/lib/cn'
import { haptic } from '@/lib/native'
import { views } from '@/views'

/** Floating tab bar with a separate New button, within thumb reach. Below 1024px. */
export function TabBar() {
  const { view, setView, openEditor } = useDashboard()

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-20 flex justify-center px-3 lg:hidden">
      <div className="pointer-events-auto flex w-full max-w-[28rem] items-center gap-2.5">
        <nav aria-label="Sections" className="material flex h-[3.75rem] flex-1 items-center rounded-full p-1">
          {views.map(({ id, label, icon: Icon }) => {
            const active = id === view
            return (
              <button
                key={id}
                onClick={() => {
                  if (!active) haptic()
                  setView(id)
                }}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-full flex-1 flex-col items-center justify-center gap-0.5 rounded-full transition-colors',
                  active ? 'text-accent' : 'text-muted active:text-ink',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="tab-active"
                    className="absolute inset-0 rounded-full bg-fill"
                    transition={{ type: 'spring', bounce: 0, duration: 0.32 }}
                  />
                )}
                <Icon aria-hidden className="relative size-[21px]" strokeWidth={active ? 2.2 : 1.9} />
                <span className="relative text-[0.65rem] font-medium tracking-[0.01em]">{label}</span>
              </button>
            )
          })}
        </nav>
        <motion.button
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
          onClick={() => {
            haptic()
            openEditor({ type: 'new' })
          }}
          aria-label="New"
          className="material flex size-[3.75rem] shrink-0 items-center justify-center rounded-full text-accent"
        >
          <Plus aria-hidden className="size-6" strokeWidth={2.4} />
        </motion.button>
      </div>
    </div>
  )
}
