import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { useDashboard } from '@/context/DashboardContext'
import type { Course, CourseLink } from '@/types'
import { Field, TextInput } from './fields'

const linkUrl = (c: Course | undefined, kind: CourseLink['kind']) => c?.links.find((l) => l.kind === kind)?.url ?? ''

export function CourseForm({ id, onDone }: { id?: string; onDone: () => void }) {
  const { courses, assignments } = useDashboard()
  const existing = courses.items.find((c) => c.id === id)

  const [code, setCode] = useState(existing?.code ?? '')
  const [name, setName] = useState(existing?.name ?? '')
  const [instructor, setInstructor] = useState(existing?.instructor ?? '')
  const [schedule, setSchedule] = useState(existing?.schedule ?? '')
  const [progress, setProgress] = useState(Math.round((existing?.progress ?? 0) * 100))
  const [portal, setPortal] = useState(linkUrl(existing, 'portal'))
  const [materials, setMaterials] = useState(linkUrl(existing, 'materials'))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const links: CourseLink[] = []
    if (portal.trim()) links.push({ label: 'Course portal', url: portal.trim(), kind: 'portal' })
    if (materials.trim()) links.push({ label: 'Materials', url: materials.trim(), kind: 'materials' })
    const data = {
      code: code.trim(),
      name: name.trim(),
      instructor: instructor.trim(),
      schedule: schedule.trim(),
      progress: progress / 100,
      links,
    }
    if (existing) courses.update(existing.id, data)
    else courses.add(data)
    onDone()
  }

  const remove = () => {
    if (!existing || !confirm(`Delete ${existing.name} and its deadlines?`)) return
    assignments.set((list) => list.filter((a) => a.courseId !== existing.id))
    courses.remove(existing.id)
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-[7rem_1fr] gap-3">
        <Field label="Code">
          <TextInput value={code} onChange={(e) => setCode(e.target.value)} placeholder="CS 310" />
        </Field>
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Algorithms" required autoFocus={!existing} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Instructor">
          <TextInput value={instructor} onChange={(e) => setInstructor(e.target.value)} />
        </Field>
        <Field label="When">
          <TextInput value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="Tue, Thu 13:00" />
        </Field>
      </div>
      <Field label={`Syllabus progress: ${progress}%`}>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={progress}
          onChange={(e) => setProgress(+e.target.value)}
          className="w-full accent-[var(--color-accent)]"
        />
      </Field>
      <Field label="Course portal link">
        <TextInput type="url" inputMode="url" value={portal} onChange={(e) => setPortal(e.target.value)} placeholder="https://" />
      </Field>
      <Field label="Materials link">
        <TextInput type="url" inputMode="url" value={materials} onChange={(e) => setMaterials(e.target.value)} placeholder="https://" />
      </Field>
      <div className="mt-2 flex gap-2">
        {existing && (
          <Button variant="danger" onClick={remove}>
            Delete
          </Button>
        )}
        <Button type="submit" variant="primary" className="ml-auto">
          {existing ? 'Save course' : 'Add course'}
        </Button>
      </div>
    </form>
  )
}
