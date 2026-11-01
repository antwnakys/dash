import { Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { TaskCategory } from '@/types'
import { categories, categoryLabel } from './categories'

export function AddTask({ defaultCategory, onAdd }: { defaultCategory: TaskCategory; onAdd: (title: string, category: TaskCategory) => void }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<TaskCategory | null>(null)
  const chosen = category ?? defaultCategory

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onAdd(trimmed, chosen)
    setTitle('')
  }

  return (
    <form
      onSubmit={submit}
      className="flex items-center gap-2 rounded-xl border border-line bg-white/[0.02] py-1 pr-1 pl-3 transition-colors focus-within:border-accent/50"
    >
      <Plus aria-hidden className="size-4 shrink-0 text-faint" />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task"
        aria-label="New task"
        className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-ink placeholder:text-faint focus:outline-none"
      />
      <select
        value={chosen}
        onChange={(e) => setCategory(e.target.value as TaskCategory)}
        aria-label="Category"
        className="rounded-lg bg-white/[0.04] px-2 py-1.5 text-xs text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {categories.map((c) => (
          <option key={c} value={c} className="bg-raised">
            {categoryLabel[c]}
          </option>
        ))}
      </select>
    </form>
  )
}
