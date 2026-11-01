import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface PanelProps {
  title: string
  /** Short supporting text beside the title, e.g. a count. */
  meta?: ReactNode
  action?: ReactNode
  className?: string
  children: ReactNode
}

export function Panel({ title, meta, action, className, children }: PanelProps) {
  return (
    <section aria-label={title} className={cn('glass flex flex-col rounded-3xl p-5 sm:p-6', className)}>
      <header className="mb-5 flex min-h-8 items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-[15px] font-semibold tracking-tight whitespace-nowrap text-ink">{title}</h2>
          {meta && <span className="text-sm text-muted">{meta}</span>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}
