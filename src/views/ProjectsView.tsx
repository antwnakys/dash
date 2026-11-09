import { CalendarClock, Flag, Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { AddTask } from '@/components/tasks/AddTask'
import { Checkbox } from '@/components/tasks/Checkbox'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Reveal, RevealItem } from '@/components/ui/Reveal'
import { Card } from '@/components/ui/Section'
import { useDashboard } from '@/context/DashboardContext'
import { useNow } from '@/hooks/useNow'
import { useTaskActions } from '@/hooks/useTaskActions'
import { cn } from '@/lib/cn'
import { courseColors } from '@/lib/courseColor'
import { countdown } from '@/lib/date'
import { dueText } from '@/lib/taskDue'
import type { Project } from '@/types'

function ProjectCard({ project, now }: { project: Project; now: Date }) {
  const { tasks, projects, openEditor, notify } = useDashboard()
  const actions = useTaskActions()
  const own = tasks.tasks.filter((t) => t.projectId === project.id)
  const open = own.filter((t) => !t.done)
  const milestones = project.milestones ?? []
  const parts = own.length + milestones.length
  const doneParts = own.filter((t) => t.done).length + milestones.filter((m) => m.done).length
  const pct = parts ? Math.round((doneParts / parts) * 100) : 0
  const next = milestones.find((m) => !m.done)
  const deadline = project.deadline ? new Date(`${project.deadline}T23:59`) : undefined

  return (
    <article className={cn('surface flex flex-col', project.done && 'opacity-60')}>
      <button onClick={() => openEditor({ type: 'project', id: project.id })} className="px-5 pt-5 pb-4 text-left">
        <span className="flex items-center gap-2">
          {project.color && <span className="size-2.5 rounded-full" style={{ background: courseColors[project.color] }} />}
          <span className="text-caption text-muted">{project.done ? 'Finished' : `${open.length} open ${open.length === 1 ? 'task' : 'tasks'}`}</span>
          {deadline && !project.done && (
            <span className={cn('ml-auto inline-flex items-center gap-1 text-caption', deadline < now ? 'text-danger' : 'text-muted')}>
              <CalendarClock aria-hidden className="size-3.5" /> {countdown(deadline, now)}
            </span>
          )}
        </span>
        <h3 className="mt-1 text-headline text-ink">{project.name}</h3>
        {project.description && <p className="mt-0.5 line-clamp-2 text-subhead text-muted">{project.description}</p>}
        <div className="mt-4 flex items-center gap-3">
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-fill-strong">
            <span className="block h-full rounded-full bg-ink/75 transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </span>
          <span className="metric text-headline text-ink">{pct}%</span>
        </div>
        {next && (
          <p className="mt-2 flex items-center gap-1.5 text-subhead text-muted">
            <Flag aria-hidden className="size-3.5 text-[var(--metal)]" strokeWidth={2.2} /> Next: {next.title}
          </p>
        )}
      </button>
      <div className="border-t border-line">
        <AddTask
          defaultCategory="projects"
          onAdd={(title, category, extra) => {
            tasks.add(title, category, { ...extra, projectId: project.id })
            notify(`Added to ${project.name}`)
            if (project.done) projects.update(project.id, { done: undefined })
          }}
        />
        <ul className="separated border-t border-line">
          {open.slice(0, 5).map((t) => (
            <li key={t.id} className="flex min-h-11 items-center gap-3 px-4 py-1.5">
              <Checkbox checked={t.done} label={t.title} onToggle={() => actions.toggle(t)} />
              <button onClick={() => openEditor({ type: 'task', id: t.id })} className="min-w-0 flex-1 text-left">
                <span className="block truncate text-body text-ink">{t.title}</span>
                {t.due && <span className="block text-caption text-muted">{dueText(t.due, t.dueAllDay, now)}</span>}
              </button>
            </li>
          ))}
          {open.length > 5 && <li className="px-4 py-2 text-caption text-muted">and {open.length - 5} more in Tasks</li>}
        </ul>
      </div>
    </article>
  )
}

/** Projects: personal projects with their tasks (the same tasks as in Tasks), milestones, deadline and progress. */
export function ProjectsView() {
  const { projects, openEditor } = useDashboard()
  const now = useNow(60_000)
  const list = [...projects.items].sort((a, b) => Number(Boolean(a.done)) - Number(Boolean(b.done)) || (a.deadline ?? '~').localeCompare(b.deadline ?? '~'))
  const active = list.filter((p) => !p.done).length
  return (
    <Reveal id="projects">
      <PageHeader
        shortTitle="Projects"
        eyebrow="Personal work"
        title="Projects"
        aside={
          <Button variant="primary" onClick={() => openEditor({ type: 'project' })}>
            <Plus aria-hidden className="size-4" strokeWidth={2.4} />
            New project
          </Button>
        }
        summary={list.length > 0 && `${active} active ${active === 1 ? 'project' : 'projects'}. Tasks you add here also show in Tasks and Today.`}
      />
      {list.length === 0 ? (
        <RevealItem>
          <Card>
            <EmptyState message="No projects yet. A project groups tasks and milestones toward one result, with a deadline if it has one.">
              <Button size="sm" variant="primary" onClick={() => openEditor({ type: 'project' })}>
                New project
              </Button>
            </EmptyState>
          </Card>
        </RevealItem>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <RevealItem key={p.id}>
              <ProjectCard project={p} now={now} />
            </RevealItem>
          ))}
        </div>
      )}
    </Reveal>
  )
}
