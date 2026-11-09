import { AnimatePresence, motion } from 'framer-motion'
import { Ellipsis, Plus, Settings, Timer } from 'lucide-react'
import { useState } from 'react'
import { useDashboard } from '@/context/DashboardContext'
import { useScrollState } from '@/hooks/useScrollState'
import { cn } from '@/lib/cn'
import { spring } from '@/lib/motion'
import { haptic } from '@/lib/native'
import { phoneTabs, views } from '@/views'

/** Floating tab bar with a separate New button, within thumb reach. Below 1024px. */
export function TabBar() {
  const { view, setView, openEditor, setFocusOpen } = useDashboard()
  const [more, setMore] = useState(false)
  const tabs = views.filter((v) => phoneTabs.includes(v.id))
  const rest = views.filter((v) => !phoneTabs.includes(v.id))
  const inMore = rest.some((v) => v.id === view)
  // Scrolling down slims the bar to icons; scrolling up brings the labels back.
  const { down: compact } = useScrollState()

  return (
    <>
    <AnimatePresence>
      {more && (
        <motion.div
          key="more"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-20 lg:hidden"
          onClick={() => setMore(false)}
        >
          <motion.nav
            aria-label="More sections"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={spring.snappy}
            onClick={(e) => e.stopPropagation()}
            className="material absolute right-3 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.5rem)] w-56 overflow-hidden rounded-[var(--radius-chrome)] p-1.5"
          >
            {[
              ...rest.map((v) => ({ key: v.id, label: v.label, icon: v.icon, run: () => setView(v.id), active: v.id === view })),
              { key: 'focus', label: 'Focus', icon: Timer, run: () => setFocusOpen(true), active: false },
              { key: 'settings', label: 'Settings', icon: Settings, run: () => openEditor({ type: 'settings' }), active: false },
            ].map(({ key, label, icon: Icon, run, active }) => (
              <button
                key={key}
                onClick={() => {
                  haptic()
                  setMore(false)
                  run()
                }}
                className={cn('flex h-11 w-full items-center gap-3 rounded-[var(--radius-control)] px-3 text-body', active ? 'bg-fill-strong font-medium text-ink' : 'text-ink active:bg-fill')}
              >
                <Icon aria-hidden className={cn('size-[19px]', active ? 'text-accent' : 'text-muted')} strokeWidth={2} />
                {label}
              </button>
            ))}
          </motion.nav>
        </motion.div>
      )}
    </AnimatePresence>
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-20 flex justify-center px-3 lg:hidden">
      <div className="pointer-events-auto flex w-full max-w-[28rem] items-center gap-2.5">
        <motion.nav
          aria-label="Sections"
          animate={{ height: compact ? 52 : 60 }}
          transition={spring.smooth}
          className="material flex flex-1 items-center rounded-[var(--radius-bar)] p-1"
        >
          {[...tabs, { id: 'more' as const, label: 'More', icon: Ellipsis }].map(({ id, label, icon: Icon }) => {
            const active = id === 'more' ? inMore || more : id === view
            return (
              <button
                key={id}
                onClick={() => {
                  haptic()
                  if (id === 'more') return setMore((m) => !m)
                  setMore(false)
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
                    transition={{ ...spring.snappy, damping: 28 }}
                  />
                )}
                {/* The icon you pick springs up from slightly small, so the tap feels answered. */}
                <motion.span
                  key={active ? 'on' : 'off'}
                  className="relative flex"
                  initial={active ? { scale: 0.72, y: 3 } : false}
                  animate={{ scale: 1, y: 0 }}
                  transition={spring.bouncy}
                >
                  <Icon aria-hidden className="size-[21px]" strokeWidth={active ? 2.2 : 1.9} />
                </motion.span>
                <motion.span
                  animate={{ opacity: compact ? 0 : 1, height: compact ? 0 : 'auto' }}
                  transition={spring.smooth}
                  className="relative overflow-hidden text-[0.65rem] font-medium tracking-[0.01em]"
                >
                  {label}
                </motion.span>
              </button>
            )
          })}
        </motion.nav>
        <motion.button
          whileTap={{ scale: 0.88 }}
          transition={spring.bouncy}
          onClick={() => {
            haptic()
            openEditor({ type: 'new' })
          }}
          aria-label="New"
          animate={{ width: compact ? 52 : 60, height: compact ? 52 : 60 }}
          className="material flex shrink-0 items-center justify-center rounded-[var(--radius-bar)] text-accent"
        >
          <Plus aria-hidden className="size-6" strokeWidth={2.4} />
        </motion.button>
      </div>
    </div>
    </>
  )
}
