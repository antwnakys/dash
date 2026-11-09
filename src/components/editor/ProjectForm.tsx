import { Plus, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Checkbox } from '@/components/tasks/Checkbox'
import { Button } from '@/components/ui/Button'
import { useDashboard } from '@/context/DashboardContext'
import { courseColorNames, courseColors } from '@/lib/courseColor'
import { uid } from '@/lib/id'
import { formatDate } from '@/lib/schedule'
import type { CourseColor, Milestone } from '@/types'
import { Field, PickerPill, TextArea, TextInput, Toggle } from './fields'

/** New project or edit one: description, deadline, colour, milestones and notes. Its tasks live in Tasks. */
export function ProjectForm({ id, onDone }: { id?: string; onDone: () => void }) {
  const { projects, tasks, notify } = useDashboard()
  const existing = projects.items.find((p) => p.id === id)
  const [name, setName] = useState(existing?.name ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [deadline, setDeadline] = useState(existing?.deadline ?? '')
  const [color, setColor] = useState<CourseColor | undefined>(existing?.color)
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [milestones, setMilestones] = useState<Milestone[]>(existing?.milestones ?? [])
  const [newMilestone, setNewMilestone] = useState('')
  const [done, setDone] = useState(Boolean(existing?.done))

  const addMilestone = () => {
    const t = newMilestone.trim()
    if (!t) return
    setMilestones((m) => [...m, { id: uid(), title: t, done: false }])
    setNewMilestone('')
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const pending = newMilestone.trim() ? [...milestones, { id: uid(), title: newMilestone.trim(), done: false }] : milestones
    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      deadline: deadline || undefined,
      color,
      notes: notes.trim() || undefined,
      milestones: pending.length ? pending : undefined,
      done: done || undefined,
    }
    if (existing) projects.update(existing.id, data)
    else projects.add({ ...data, createdAt: new Date().toISOString() })
    notify(existing ? 'Project saved' : 'Project added')
    onDone()
  }

  const remove = () => {
    if (!existing) return
    const linked = tasks.tasks.filter((t) => t.projectId === existing.id)
    for (const t of linked) tasks.update(t.id, { projectId: undefined })
    projects.remove(existing.id)
    notify('Project deleted (its tasks stay in Tasks)', 'default', {
      label: 'Undo',
      run: () => {
        projects.set((list) => (list.some((p) => p.id === existing.id) ? list : [...list, existing]))
        for (const t of linked) tasks.update(t.id, { projectId: existing.id })
      },
    })
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <Field label="Name">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Portfolio site" required autoFocus={!existing} />
      </Field>
      <Field label="Description">
        <TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What it is and what done looks like" />
      </Field>
      <div className="separated overflow-hidden rounded-[var(--radius-control)] bg-fill/60">
        <div className="flex min-h-12 items-center justify-between gap-3 px-4 py-1.5">
          <span className="text-body text-ink">Deadline</span>
          <PickerPill type="date" label="Deadline" value={deadline} display={formatDate} placeholder="None" onChange={setDeadline} />
        </div>
        {existing && (
          <div className="px-3 py-1.5">
            <Toggle label="Finished" checked={done} onChange={setDone} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-subhead font-medium text-muted">Colour</span>
        <div className="flex flex-wrap gap-2 px-1" role="radiogroup" aria-label="Colour">
          {(Object.keys(courseColors) as CourseColor[]).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={courseColorNames[c]}
              onClick={() => setColor(color === c ? undefined : c)}
              className="flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-[var(--surface)] aria-checked:ring-2 aria-checked:ring-ink"
            >
              <span className="size-6 rounded-full" style={{ background: courseColors[c] }} />
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-subhead font-medium text-muted">Milestones</span>
        <div className="separated overflow-hidden rounded-[var(--radius-control)] bg-fill/60">
          {milestones.map((m) => (
            <div key={m.id} className="flex min-h-11 items-center gap-3 py-1 pr-1.5 pl-3">
              <Checkbox checked={m.done} label={m.title} onToggle={() => setMilestones((l) => l.map((x) => (x.id === m.id ? { ...x, done: !x.done } : x)))} />
              <input
                value={m.title}
                onChange={(e) => setMilestones((l) => l.map((x) => (x.id === m.id ? { ...x, title: e.target.value } : x)))}
                aria-label="Milestone"
                className={`min-w-0 flex-1 bg-transparent text-base outline-none sm:text-[0.9375rem] ${m.done ? 'text-faint line-through' : 'text-ink'}`}
              />
              <button type="button" onClick={() => setMilestones((l) => l.filter((x) => x.id !== m.id))} aria-label={`Remove “${m.title}”`} className="flex size-8 items-center justify-center rounded-full text-faint hover:bg-fill hover:text-ink">
                <X aria-hidden className="size-4" />
              </button>
            </div>
          ))}
          <div className="flex min-h-11 items-center gap-3 pr-1.5 pl-3.5">
            <Plus aria-hidden className="size-4 shrink-0 text-accent" strokeWidth={2.4} />
            <input
              value={newMilestone}
              onChange={(e) => setNewMilestone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addMilestone()
                }
              }}
              placeholder="Add a milestone"
              aria-label="New milestone"
              className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-faint sm:text-[0.9375rem]"
            />
          </div>
        </div>
      </div>
      <Field label="Notes">
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </Field>
      <div className="flex items-center gap-2">
        {existing && (
          <Button variant="danger" onClick={remove}>
            Delete
          </Button>
        )}
        <Button type="submit" variant="primary" className={existing ? 'ml-auto min-w-28' : 'w-full'}>
          {existing ? 'Save project' : 'Add project'}
        </Button>
      </div>
    </form>
  )
}
