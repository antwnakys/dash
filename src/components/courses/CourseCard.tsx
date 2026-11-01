import { BookOpen, ExternalLink, PlayCircle, type LucideIcon } from 'lucide-react'
import { useDashboard } from '@/context/DashboardContext'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { cn } from '@/lib/cn'
import { countdown, dayDiff } from '@/lib/date'
import type { Assignment, Course, CourseLink } from '@/types'

const linkIcon: Record<CourseLink['kind'], LucideIcon> = {
  portal: ExternalLink,
  materials: BookOpen,
  video: PlayCircle,
}

interface CourseCardProps {
  course: Course
  /** Unsubmitted work for this course, soonest first. */
  pending: Assignment[]
  now: Date
}

export function CourseCard({ course, pending, now }: CourseCardProps) {
  const { openEditor } = useDashboard()
  const next = pending[0]
  const dueThisWeek = pending.filter((a) => dayDiff(now, new Date(a.due)) <= 7).length
  const urgent = next && dayDiff(now, new Date(next.due)) <= 1

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-line bg-white/[0.02] p-4 transition-colors hover:border-line-strong">
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={() => openEditor({ type: 'course', id: course.id })}
          className="min-w-0 text-left"
          aria-label={`Edit ${course.name}`}
        >
          <p className="text-xs text-muted">{course.code}</p>
          <h3 className="mt-0.5 truncate text-[15px] font-medium text-ink">{course.name}</h3>
        </button>
        <span
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
            dueThisWeek ? 'bg-accent/15 text-accent' : 'bg-white/[0.04] text-faint',
          )}
          title={`${dueThisWeek} due in the next 7 days`}
          aria-label={`${dueThisWeek} due in the next 7 days`}
        >
          {dueThisWeek}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-faint">Syllabus</span>
          <span className="text-muted tabular-nums">{Math.round(course.progress * 100)}%</span>
        </div>
        <ProgressBar value={course.progress} label={`${course.name} progress`} />
      </div>

      <div className="mt-auto flex items-end justify-between gap-3">
        <p className="min-w-0 text-xs text-muted">
          {next ? (
            <button onClick={() => openEditor({ type: 'deadline', id: next.id })} className="block max-w-full text-left">
              <span className="block truncate text-ink/80">{next.title}</span>
              <span className={urgent ? 'text-accent' : undefined}>due {countdown(new Date(next.due), now)}</span>
            </button>
          ) : (
            <button onClick={() => openEditor({ type: 'deadline', courseId: course.id })} className="hover:text-ink">
              Add a deadline
            </button>
          )}
        </p>
        <div className="flex shrink-0 gap-1">
          {course.links.map((link) => {
            const Icon = linkIcon[link.kind]
            return (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                title={link.label}
                aria-label={`${link.label}, ${course.name}`}
                className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/[0.06] hover:text-ink"
              >
                <Icon aria-hidden className="size-4" strokeWidth={1.75} />
              </a>
            )
          })}
        </div>
      </div>
    </article>
  )
}
