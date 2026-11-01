import { Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import { IconButton } from '@/components/ui/IconButton'
import { useDashboard } from '@/context/DashboardContext'

interface PageHeaderProps {
  title: ReactNode
  /** Small line above the title (date, context). */
  eyebrow?: ReactNode
  /** Sits on the right of the eyebrow row, e.g. weather. */
  accessory?: ReactNode
  /** Desktop-only control beside the title. */
  aside?: ReactNode
  /** One calm line under the title. */
  summary?: ReactNode
}

export function PageHeader({ title, eyebrow, accessory, aside, summary }: PageHeaderProps) {
  const { openEditor } = useDashboard()
  return (
    <header className="flex flex-col pb-7 lg:pb-9">
      <div className="flex min-h-9 items-center justify-between gap-3">
        <div className="min-w-0 truncate text-subhead font-medium text-muted">{eyebrow}</div>
        <div className="-mr-1.5 flex shrink-0 items-center gap-1">
          {accessory}
          <IconButton icon={Settings} label="Settings" onClick={() => openEditor({ type: 'settings' })} className="lg:hidden" />
        </div>
      </div>
      <div className="mt-1 flex items-end justify-between gap-6">
        <h1 className="min-w-0 text-large-title text-ink lg:text-[2.625rem]">{title}</h1>
        {aside && <div className="hidden shrink-0 lg:block">{aside}</div>}
      </div>
      {summary && <p className="mt-2.5 max-w-[42rem] text-body text-muted lg:text-[1.0625rem]">{summary}</p>}
    </header>
  )
}
