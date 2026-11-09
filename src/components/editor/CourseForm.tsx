import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import { useDashboard } from '@/context/DashboardContext'
import { useNow } from '@/hooks/useNow'
import { average, formatGrade, onScale, SCALE } from '@/lib/grades'
import { formatMeetings, newMeeting, parseSchedule } from '@/lib/schedule'
import { Plus, X } from 'lucide-react'
import { courseColorNames, courseColors } from '@/lib/courseColor'
import type { Assignment, Course, CourseColor, CourseLink, CourseMeeting } from '@/types'
import { Field, TextArea, TextInput } from './fields'
import { ScheduleEditor } from './ScheduleEditor'

/** Saved times, or ones read from an older free-text schedule, or one empty time to fill in. */
function initialMeetings(c?: Course): CourseMeeting[] {
  if (c?.meetings?.length) return c.meetings
  const parsed = c?.schedule ? parseSchedule(c.schedule) : []
  return parsed.length ? parsed : [newMeeting()]
}

const linkUrl = (c: Course | undefined, kind: CourseLink['kind']) => c?.links.find((l) => l.kind === kind)?.url ?? ''

const dueFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })

/** Everything due for this course, with grades; tap one to grade or edit it. */
function WorkAndGrades({ courseId, list, onOpen }: { courseId: string; list: Assignment[]; onOpen: (id: string) => void }) {
  const now = useNow(60_000)
  const work = list.filter((a) => a.courseId === courseId).sort((a, b) => a.due.localeCompare(b.due))
  if (!work.length) return null
  const avg = average(work)
  return (
    <div className="flex flex-col gap-1.5">
      <span className="px-1 text-subhead font-medium text-muted">
        Work and grades{avg && ` · average ${formatGrade(avg.value)}/${SCALE}`}
      </span>
      <ul className="separated overflow-hidden rounded-[var(--radius-control)] bg-fill/60">
        {work.map((a) => {
          const g = onScale(a)
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => onOpen(a.id)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-fill"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body text-ink">{a.title}</span>
                  <span className="block text-caption text-muted">
                    {dueFmt.format(new Date(a.due))} · {a.kind === 'assignment' ? 'Assignment' : a.kind === 'exam' ? 'Exam' : 'Quiz'}
                    {a.submitted && g == null && ' · done'}
                  </span>
                </span>
                <span className={g == null ? 'text-subhead text-accent' : 'text-body font-semibold text-ink tabular-nums'}>
                  {g == null ? (a.submitted || new Date(a.due) < now ? 'Add grade' : '') : `${formatGrade(a.grade!)}/${a.outOf ?? SCALE}`}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function CourseForm({ id, onDone }: { id?: string; onDone: () => void }) {
  const { courses, assignments, notify, openEditor } = useDashboard()
  const existing = courses.items.find((c) => c.id === id)

  const [code, setCode] = useState(existing?.code ?? '')
  const [name, setName] = useState(existing?.name ?? '')
  const [instructor, setInstructor] = useState(existing?.instructor ?? '')
  const [meetings, setMeetings] = useState(() => initialMeetings(existing))
  const [term, setTerm] = useState<NonNullable<Course['term']>>(existing?.term ?? {})
  const [progress, setProgress] = useState(Math.round((existing?.progress ?? 0) * 100))
  const [portal, setPortal] = useState(linkUrl(existing, 'portal'))
  const [materials, setMaterials] = useState(linkUrl(existing, 'materials'))
  const [meeting, setMeeting] = useState(linkUrl(existing, 'meeting'))
  const [color, setColor] = useState<CourseColor | undefined>(existing?.color)
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [resources, setResources] = useState<Array<{ label: string; url: string }>>(
    () => existing?.links.filter((l) => l.kind === 'other').map((l) => ({ label: l.label, url: l.url })) ?? [],
  )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const links: CourseLink[] = []
    if (portal.trim()) links.push({ label: 'Course portal', url: portal.trim(), kind: 'portal' })
    if (materials.trim()) links.push({ label: 'Materials', url: materials.trim(), kind: 'materials' })
    if (meeting.trim()) links.push({ label: 'Online lesson', url: meeting.trim(), kind: 'meeting' })
    // Keep links of other kinds (e.g. recorded lectures) that this form doesn't edit.
    links.push(...(existing?.links ?? []).filter((l) => l.kind === 'video'))
    for (const r of resources) {
      const url = r.url.trim()
      if (url) links.push({ label: r.label.trim() || url.replace(/^https?:\/\//, '').split('/')[0], url: /^[a-z]+:/i.test(url) ? url : `https://${url}`, kind: 'other' })
    }
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
      color,
      notes: notes.trim() || undefined,
    }
    if (existing) courses.update(existing.id, data)
    else courses.add(data)
    notify(existing ? 'Course saved' : 'Course added')
    onDone()
  }

  const remove = () => {
    if (!existing) return
    const work = assignments.items.filter((a) => a.courseId === existing.id)
    assignments.set((list) => list.filter((a) => a.courseId !== existing.id))
    courses.remove(existing.id)
    notify('Course deleted', 'default', {
      label: 'Undo',
      run: () => {
        courses.set((list) => (list.some((c) => c.id === existing.id) ? list : [...list, existing]))
        assignments.set((list) => [...list, ...work.filter((w) => !list.some((a) => a.id === w.id))])
      },
    })
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
        <span className="px-1 text-subhead font-medium text-muted">Colour</span>
        <div className="flex flex-wrap gap-2 px-1" role="radiogroup" aria-label="Colour">
          {(Object.keys(courseColors) as CourseColor[]).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={courseColorNames[c]}
              title={courseColorNames[c]}
              onClick={() => setColor(color === c ? undefined : c)}
              className="flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-[var(--surface)] transition-shadow aria-checked:ring-2 aria-checked:ring-ink"
            >
              <span className="size-6 rounded-full" style={{ background: courseColors[c] }} />
            </button>
          ))}
        </div>
      </div>
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
      {existing && <WorkAndGrades courseId={existing.id} list={assignments.items} onOpen={(id) => openEditor({ type: 'deadline', id })} />}
      <Field label="Course portal link">
        <TextInput type="url" inputMode="url" value={portal} onChange={(e) => setPortal(e.target.value)} placeholder="https://" />
      </Field>
      <Field label="Teams link" hint="For online lessons. A link in the calendar event is used first.">
        <TextInput type="url" inputMode="url" value={meeting} onChange={(e) => setMeeting(e.target.value)} placeholder="https://teams.microsoft.com/…" />
      </Field>
      <Field label="Materials link">
        <TextInput type="url" inputMode="url" value={materials} onChange={(e) => setMaterials(e.target.value)} placeholder="https://" />
      </Field>
      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-subhead font-medium text-muted">Resources</span>
        {resources.map((r, i) => (
          <div key={i} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto] items-center gap-2">
            <TextInput value={r.label} onChange={(e) => setResources((l) => l.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="Name" aria-label="Resource name" />
            <TextInput inputMode="url" autoCapitalize="off" autoCorrect="off" value={r.url} onChange={(e) => setResources((l) => l.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} placeholder="https://" aria-label="Resource link" />
            <button type="button" onClick={() => setResources((l) => l.filter((_, j) => j !== i))} aria-label="Remove resource" className="flex size-9 items-center justify-center rounded-full text-faint hover:bg-fill hover:text-ink">
              <X aria-hidden className="size-4" />
            </button>
          </div>
        ))}
        <Button size="sm" variant="plain" className="self-start" onClick={() => setResources((l) => [...l, { label: '', url: '' }])}>
          <Plus aria-hidden className="size-3.5" strokeWidth={2.4} />
          Add a resource
        </Button>
      </div>
      <Field label="Notes">
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Exam format, office hours, what to remember…" />
      </Field>
      <div className="mt-1 flex items-center gap-2">
        {existing && (
          <ConfirmButton onConfirm={remove} confirmLabel="Press again: delete course and its deadlines">
            Delete
          </ConfirmButton>
        )}
        <Button type="submit" variant="primary" className="ml-auto min-w-28">
          {existing ? 'Save course' : 'Add course'}
        </Button>
      </div>
    </form>
  )
}
