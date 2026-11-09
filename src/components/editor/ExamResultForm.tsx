import { Check, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { useDashboard } from '@/context/DashboardContext'
import { cn } from '@/lib/cn'
import { fmt } from '@/lib/date'
import { SCALE } from '@/lib/grades'
import { press } from '@/lib/motion'
import type { EditorTarget, ExamResult } from '@/types'
import { Field, TextInput } from './fields'

type Target = Extract<EditorTarget, { type: 'examResult' }>

const num = (s: string) => {
  const n = Number(s.replace(',', '.'))
  return s.trim() === '' || !Number.isFinite(n) ? undefined : n
}

/**
 * After an exam: the score and whether it was passed. Saving moves the exam into the history (off the
 * upcoming list). An exam that is a course deadline also gets the grade, so course averages include it.
 */
export function ExamResultForm({ target, onDone }: { target: Target; onDone: () => void }) {
  const { examResults, assignments, notify } = useDashboard()
  const existing = examResults.items.find((r) => r.id === target.id)
  const [score, setScore] = useState(existing?.score != null ? String(existing.score) : '')
  const [outOf, setOutOf] = useState(String(existing?.outOf ?? SCALE))
  const [passed, setPassed] = useState<boolean | undefined>(existing?.passed)
  const [chose, setChose] = useState(existing?.passed !== undefined)
  const date = new Date(existing?.date ?? target.date)

  // Until pass/fail is picked by hand, it follows the score: half marks or more counts as passed.
  const typeScore = (value: string) => {
    setScore(value)
    const s = num(value)
    const o = num(outOf)
    if (!chose && s != null && o) setPassed(s / o >= 0.5)
  }

  const save = (e: FormEvent) => {
    e.preventDefault()
    const result: ExamResult = {
      id: target.id,
      subject: existing?.subject ?? target.subject,
      date: existing?.date ?? target.date,
      allDay: existing?.allDay ?? target.allDay,
      courseId: existing?.courseId ?? target.courseId,
      score: num(score),
      outOf: num(score) != null ? num(outOf) : undefined,
      passed,
    }
    examResults.set((list) => [...list.filter((r) => r.id !== target.id), result])
    if (target.source === 'assignment' && assignments.items.some((a) => a.id === target.id))
      assignments.update(target.id, { grade: result.score, outOf: result.outOf, submitted: true })
    notify('Result saved. The exam is in your history now.')
    onDone()
  }

  const remove = () => {
    examResults.remove(target.id)
    notify('Result removed')
    onDone()
  }

  const outcome = (value: boolean, label: string, Icon: typeof Check, tone: string) => (
    <motion.button
      type="button"
      whileTap={press}
      aria-pressed={passed === value}
      onClick={() => {
        setChose(true)
        setPassed(passed === value ? undefined : value)
      }}
      className={cn(
        'flex h-12 flex-1 items-center justify-center gap-2 rounded-[var(--radius-control)] text-headline transition-colors',
        passed === value ? tone : 'bg-fill text-ink hover:bg-fill-strong',
      )}
    >
      <Icon aria-hidden className="size-5" strokeWidth={2.4} />
      {label}
    </motion.button>
  )

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      <div className="px-1">
        <div className="text-headline text-ink">{existing?.subject ?? target.subject}</div>
        <div className="text-subhead text-muted">{target.allDay || existing?.allDay ? fmt.longDate.format(date) : `${fmt.longDate.format(date)}, ${fmt.time.format(date)}`}</div>
      </div>
      <div className="flex gap-3">
        <Field label="Score">
          <TextInput value={score} onChange={(e) => typeScore(e.target.value)} inputMode="decimal" placeholder="8.5" autoFocus={!existing} />
        </Field>
        <Field label="Out of">
          <TextInput value={outOf} onChange={(e) => setOutOf(e.target.value)} inputMode="decimal" />
        </Field>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-subhead font-medium text-muted">How did it go?</span>
        <div className="flex gap-3">
          {outcome(true, 'Passed', Check, 'bg-course text-white')}
          {outcome(false, 'Failed', X, 'bg-danger text-white')}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {existing && (
          <Button variant="danger" onClick={remove}>
            Remove result
          </Button>
        )}
        <Button type="submit" variant="primary" className={existing ? 'ms-auto min-w-28' : 'w-full'}>
          Save result
        </Button>
      </div>
    </form>
  )
}
