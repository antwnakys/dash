import { motion } from 'framer-motion'
import { Plus, Search, Settings, Timer } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { useDashboard } from '@/context/DashboardContext'
import { fmtLeft } from '@/hooks/useFocusTimer'
import { cn } from '@/lib/cn'
import { spring } from '@/lib/motion'
import { views } from '@/views'
import { SyncBadge } from './SyncBadge'

/**
 * Obsidian on wide screens (1024px+): one compact glass bar along the top instead of the sidebar. Sections on the left
 * with a fine underline under the current one; search, focus, new, settings and your initial on the right.
 */
export function TopBar() {
  const { view, setView, openEditor, setPalette, setFocusOpen, focus, profile } = useDashboard()
  const initial = (profile.name || 'D').trim().slice(0, 1).toUpperCase()
  return (
    <header className="material sticky top-0 z-20 hidden h-14 items-center rounded-none border-b border-line px-6 shadow-none lg:flex">
      <div className="mx-auto flex w-full max-w-[86rem] items-center gap-6">
        <button onClick={() => setView('today')} className="flex items-center gap-2" aria-label="dash, Today">
          <Logo className="size-6" />
          <span className="text-headline tracking-tight text-ink">dash</span>
        </button>
        <nav aria-label="Sections" className="flex items-center gap-1">
          {views.map(({ id, label }, i) => {
            const active = id === view
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                aria-current={active ? 'page' : undefined}
                title={`${label} (${i + 1})`}
                className={cn('relative h-14 px-3 text-subhead transition-colors', active ? 'font-medium text-ink' : 'text-muted hover:text-ink')}
              >
                {label}
                {active && <motion.span layoutId="topbar-active" className="absolute inset-x-3 bottom-3 h-px bg-ink" transition={spring.snappy} />}
              </button>
            )
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <SyncBadge />
          <button
            onClick={() => setPalette(true)}
            className="flex h-8 w-56 items-center gap-2 rounded-full bg-fill px-3 text-subhead text-muted transition-colors hover:bg-fill-strong hover:text-ink"
          >
            <Search aria-hidden className="size-4" strokeWidth={2} />
            <span className="flex-1 text-left">Search</span>
            <kbd className="text-caption">⌘K</kbd>
          </button>
          <button
            onClick={() => setFocusOpen(true)}
            title="Focus (F)"
            className={cn(
              'flex h-8 items-center gap-1.5 rounded-full px-3 text-subhead font-medium tabular-nums transition-colors',
              focus.running ? 'bg-accent/15 text-accent' : 'bg-fill text-muted hover:bg-fill-strong hover:text-ink',
            )}
          >
            <Timer aria-hidden className="size-4" strokeWidth={2} />
            {focus.running || focus.active ? fmtLeft(focus.left) : 'Focus'}
          </button>
          <button
            onClick={() => openEditor({ type: 'new' })}
            title="New (N)"
            aria-label="New"
            className="flex size-8 items-center justify-center rounded-full bg-accent-fill text-accent-ink transition-transform active:scale-95"
          >
            <Plus aria-hidden className="size-4" strokeWidth={2.6} />
          </button>
          <button onClick={() => openEditor({ type: 'settings' })} aria-label="Settings" className="flex size-8 items-center justify-center rounded-full text-muted hover:bg-fill hover:text-ink">
            <Settings aria-hidden className="size-[18px]" strokeWidth={2} />
          </button>
          <span aria-hidden className="flex size-8 items-center justify-center rounded-full bg-surface-2 text-subhead font-semibold text-ink ring-1 ring-line">
            {initial}
          </span>
        </div>
      </div>
    </header>
  )
}
