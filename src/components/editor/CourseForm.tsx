import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { useDashboard } from '@/context/DashboardContext'
import { formatMeetings, newMeeting, parseSchedule } from '@/lib/schedule'
import type { Course, CourseLink, CourseMeeting } from '@/types'
import { Field, TextInput } from './fields'
import { ScheduleEditor } from './ScheduleEditor'

/** Saved times, or ones read from an older free-text schedule, or one empty time to fill in. */
function initialMeetings(c?: Course): CourseMeeting[] {
  if (c?.meetings?.length) return c.meetings
  const parsed = c?.schedule ? parseSchedule(c.schedule) : []
  return parsed.length ? parsed : [newMeeting()]
}

const linkUrl = (c: Course | undefined, kind: CourseLink['kind']) => c?.links.find((l) => l.kind === kind)?.url ?? ''

export function CourseForm({ id, onDone }: { id?: string; onDone: () => void }) {
  const { courses, assignments, notify } = useDashboard()
  const existing = courses.items.find((c) => c.id === id)

  const [code, setCode] = useState(existing?.code ?? '')
  const [name, setName] = useState(existing?.name ?? '')
  const [instructor, setInstructor] = useState(existing?.instructor ?? '')
  const [meetings, setMeetings] = useState(() => initialMeetings(existing))
  const [term, setTerm] = useState<NonNullable<Course['term']>>(existing?.term ?? {})
  const [progress, setProgress] = useState(Math.round((existing?.progress ?? 0) * 100))
  const [portal, setPortal] = useState(linkUrl(existing, 'portal'))
  const [materials, setMaterials] = useState(linkUrl(existing, 'materials'))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const links: CourseLink[] = []
    if (portal.trim()) links.push({ label: 'Course portal', url: portal.trim(), kind: 'portal' })
    if (materials.trim()) links.push({ label: 'Materials', url: materials.trim(), kind: 'materials' })
    const set = meetings.filter((m) => m.days.length)
    const data = {
      code: code.trim(),
      name: name.trim(),
      instructor: instructor.trim(),
      // No days picked keeps whatever schedule text an older version saved.
      schedule: set.length ? formatMeetings(set) : (existing?.meetings?.length ? '' : (existing?.schedule ?? '')),
      meetings: set.length ? set : undefined,
      term: term.start || term.end ? term : undefined,
      progress: progress / 100,
      links,
    }
    if (existing) courses.update(existing.id, data)
    else courses.add(data)
    notify(existing ? 'Course saved' : 'Course added')
    onDone()
  }

  const remove = () => {
    if (!existing || !confirm(`Delete ${existing.name} and its deadlines?`)) return
    assignments.set((list) => list.filter((a) => a.courseId !== existing.id))
    courses.remove(existing.id)
    notify('Course deleted')
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="grid grid-cols-[7rem_1fr] gap-3">
        <Field label="Code">
          <TextInput value={code} onChange={(e) => setCode(e.target.value)} placeholder="CS 310" />
        </Field>
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Algorithms" required autoFocus={!existing} />
        </Field>
      </div>
      <Field label="Instructor">
        <TextInput value={instructor} onChange={(e) => setInstructor(e.target.value)} />
      </Field>
      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-subhead font-medium text-muted">Class times</span>
        <ScheduleEditor meetings={meetings} onMeetings={setMeetings} term={term} onTerm={setTerm} />
      </div>
      <Field label={`Syllabus progress: ${progress}%`}>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={progress}
          onChange={(e) => setProgress(+e.target.value)}
          className="h-6 w-full accent-[var(--accent-fill)]"
        />
      </Field>
      <Field label="Course portal link">
        <TextInput type="url" inputMode="url" value={portal} onChange={(e) => setPortal(e.target.value)} placeholder="https://" />
      </Field>
      <Field label="Materials link">
        <TextInput type="url" inputMode="url" value={materials} onChange={(e) => setMaterials(e.target.value)} placeholder="https://" />
      </Field>
      <div className="mt-1 flex items-center gap-2">
        {existing && (
          <Button variant="danger" onClick={remove}>
            Delete
          </Button>
        )}
        <Button type="submit" variant="primary" className="ml-auto min-w-28">
          {existing ? 'Save course' : 'Add course'}
        </Button>
      </div>
    </form>
  )
}
