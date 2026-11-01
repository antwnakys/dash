import { Bell, CalendarDays, FileText, GraduationCap, ListChecks } from 'lucide-react'
import type { AgendaKind } from '@/types'

const icons = {
  assignment: FileText,
  exam: GraduationCap,
  quiz: ListChecks,
  event: CalendarDays,
  reminder: Bell,
} satisfies Record<AgendaKind, unknown>

export function AgendaIcon({ kind, className }: { kind: AgendaKind; className?: string }) {
  const Icon = icons[kind]
  return <Icon aria-hidden className={className} strokeWidth={1.75} />
}
