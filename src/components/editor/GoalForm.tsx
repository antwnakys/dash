import { useState, type FormEvent } from 'react'
import { categories, categoryLabel } from '@/components/tasks/categories'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import { useDashboard } from '@/context/DashboardContext'
import type { Goal, TaskCategory } from '@/types'
import { Field, Select, TextInput } from './fields'

const periods = [
  { value: 'day' as const, label: 'Day' },
  { value: 'week' as const, label: 'Week' },
  { value: 'term' as const, label: 'Term' },
]
const areas = [
  { value: 'academic' as const, label: 'Academic' },
  { value: 'personal' as const, label: 'Personal' },
]
const metrics = [
  { value: 'tasks' as const, label: 'Tasks done' },
  { value: 'focus' as const, label: 'Focus time' },
  { value: 'manual' as const, label: 'Count by hand' },
]

/** New goal or edit one. "Tasks done" and "Focus time" count themselves from what you do in dash. */
export function GoalForm({ id, onDone }: { id?: string; onDone: () => void }) {
  const { goals, notify } = useDashboard()
  const existing = goals.items.find((g) => g.id === id)
  const [title, setTitle] = useState(existing?.title ?? '')
  const [period, setPeriod] = useState<Goal['period']>(existing?.period ?? 'week')
  const [area, setArea] = useState<Goal['area']>(existing?.area ?? 'academic')
  const [metric, setMetric] = useState<Goal['metric']>(existing?.metric ?? 'focus')
  const [target, setTarget] = useState(String(existing?.target ?? (metric === 'focus' ? 600 : 10)))
  const [category, setCategory] = useState<TaskCategory | ''>(existing?.category ?? '')
  // Focus targets are typed in hours, stored in minutes.
  const shownTarget = metric === 'focus' ? String(Math.round((Number(target) / 60) * 10) / 10) : target

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !(Number(target) > 0)) return
    const data = { title: title.trim(), period, area, metric, target: Math.round(Number(target)), category: metric === 'tasks' && category ? category : undefined }
    if (existing) goals.update(existing.id, data)
    else goals.add({ ...data, createdAt: new Date().toISOString() })
    notify(existing ? 'Goal saved' : 'Goal added')
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <Field label="Goal">
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Study 10 hours this week" required autoFocus={!existing} />
      </Field>
      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-subhead font-medium text-muted">For</span>
        <Segmented label="Period" options={periods} value={period} onChange={setPeriod} block />
      </div>
      <Segmented label="Area" options={areas} value={area} onChange={setArea} block />
      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-subhead font-medium text-muted">Counted by</span>
        <Segmented
          label="Counted by"
          options={metrics}
          value={metric}
          onChange={(m) => {
            setMetric(m)
            setTarget(m === 'focus' ? '600' : '5')
          }}
          block
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={metric === 'focus' ? 'Target (hours)' : 'Target'}>
          <TextInput
            inputMode="decimal"
            value={shownTarget}
            onChange={(e) => {
              const v = Number(e.target.value.replace(',', '.'))
              setTarget(String(metric === 'focus' ? Math.round(v * 60) : v))
            }}
          />
        </Field>
        {metric === 'tasks' && (
          <Field label="Which tasks">
            <Select value={category} onChange={(e) => setCategory(e.target.value as TaskCategory | '')}>
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel[c]}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>
      <div className="flex items-center gap-2">
        {existing && (
          <Button
            variant="danger"
            onClick={() => {
              goals.remove(existing.id)
              notify('Goal deleted', 'default', { label: 'Undo', run: () => goals.set((l) => (l.some((g) => g.id === existing.id) ? l : [...l, existing])) })
              onDone()
            }}
          >
            Delete
          </Button>
        )}
        <Button type="submit" variant="primary" className={existing ? 'ml-auto min-w-28' : 'w-full'}>
          {existing ? 'Save goal' : 'Add goal'}
        </Button>
      </div>
    </form>
  )
}
