import { useState, type FormEvent } from 'react'
import { categories, categoryLabel } from '@/components/tasks/categories'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import { useDashboard } from '@/context/DashboardContext'
import type { TaskCategory } from '@/types'
import { Field, TextInput } from './fields'

const options = categories.map((c) => ({ value: c, label: c === 'projects' ? 'Projects' : categoryLabel[c] }))

export function TaskForm({ onDone }: { onDone: () => void }) {
  const { tasks, notify } = useDashboard()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<TaskCategory>('college')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    tasks.add(title.trim(), category)
    notify('Task added')
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <Field label="Task">
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?" required autoFocus />
      </Field>
      <Segmented label="Category" options={options} value={category} onChange={setCategory} block />
      <Button type="submit" variant="primary" className="w-full">
        Add task
      </Button>
    </form>
  )
}
