import { AnimatePresence, motion } from 'framer-motion'
import {
  CalendarPlus,
  CheckCircle2,
  CheckSquare,
  ClipboardCheck,
  CornerDownLeft,
  FileText,
  GraduationCap,
  Plus,
  Search,
  Settings,
  Timer,
  NotebookPen,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useDashboard } from '@/context/DashboardContext'
import { cn } from '@/lib/cn'
import { blur, spring } from '@/lib/motion'
import { parseQuickAdd, priorityLabel, quickFields, repeatLabel } from '@/lib/quickAdd'
import { countdown } from '@/lib/date'
import { dueText } from '@/lib/taskDue'
import { views, type ViewId } from '@/views'
import type { EditorTarget } from '@/types'
import { categoryLabel } from '@/components/tasks/categories'

interface Item {
  id: string
  group: string
  label: string
  detail?: string
  icon: LucideIcon
  keys?: string
  run: () => void
}

const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase()
const matches = (q: string, ...fields: Array<string | undefined>) => {
  if (!q) return true
  const words = norm(q).split(/\s+/).filter(Boolean)
  const hay = norm(fields.filter(Boolean).join(' '))
  return words.every((w) => hay.includes(w))
}

const SHORTCUTS: Array<[string, string]> = [
  ['⌘K', 'Command palette'],
  ['N', 'New…'],
  ['T', 'Add a task'],
  ['F', 'Focus timer'],
  ['1–5', 'Today, Courses, Exams, Tasks, Calendar'],
  ['/', 'Search'],
  ['Esc', 'Close'],
]

/**
 * ⌘K: one box to search everything (tasks, courses, deadlines, exams, events), jump to a section, start anything new,
 * or add a task straight from what you typed (read with quick add, shown before Enter).
 */
export function CommandPalette() {
  const { palette, setPalette, tasks, courses, agenda, setView, openEditor, notify, setFocusOpen } = useDashboard()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)

  const close = () => {
    setPalette(false)
    setQuery('')
    setActive(0)
  }
  const go = (v: ViewId) => {
    close()
    setView(v)
  }
  const open = (t: EditorTarget) => {
    close()
    openEditor(t)
  }

  // Rebuilt on each render while open: a few hundred string checks at most.
  const items: Item[] = !palette ? [] : (() => {
    const q = query.trim()
    const out: Item[] = []
    let addItem: Item | undefined
    if (q) {
      const quick = parseQuickAdd(q)
      const bits = [
        quick.due && dueText(quick.due, quick.dueAllDay),
        quick.repeat && repeatLabel[quick.repeat],
        quick.priority && `${priorityLabel[quick.priority]} priority`,
        quick.category && categoryLabel[quick.category],
      ].filter(Boolean)
      addItem = {
        id: 'add',
        group: 'Add',
        label: `Add task “${quick.title}”`,
        detail: bits.length ? bits.join(' · ') : 'No date',
        icon: Plus,
        run: () => {
          const task = tasks.add(quick.title, quick.category ?? 'college', quickFields(quick))
          close()
          notify(task.due ? `Added for ${dueText(task.due, task.dueAllDay)}` : 'Task added')
        },
      }
    }
    const create: Array<[string, LucideIcon, EditorTarget]> = [
      ['New task', CheckSquare, { type: 'task' }],
      ['New exam', ClipboardCheck, { type: 'exam' }],
      ['New deadline', FileText, { type: 'deadline' }],
      ['New event', CalendarPlus, { type: 'event' }],
      ['New course', GraduationCap, { type: 'course' }],
    ]
    for (const [label, icon, target] of create)
      if (matches(q, label, 'add create')) out.push({ id: label, group: 'Create', label, icon, run: () => open(target) })
    views.forEach((v, i) => {
      if (matches(q, v.label, 'go open show')) out.push({ id: `go-${v.id}`, group: 'Go to', label: v.label, icon: v.icon, keys: String(i + 1), run: () => go(v.id) })
    })
    if (matches(q, 'focus timer pomodoro study start'))
      out.push({ id: 'focus', group: 'Go to', label: 'Focus timer', icon: Timer, keys: 'F', run: () => (close(), setFocusOpen(true)) })
    if (matches(q, 'weekly review week plan'))
      out.push({ id: 'review', group: 'Go to', label: 'Weekly review', icon: NotebookPen, run: () => open({ type: 'review' }) })
    if (matches(q, 'settings preferences backup appearance design theme'))
      out.push({ id: 'settings', group: 'Go to', label: 'Settings', icon: Settings, run: () => open({ type: 'settings' }) })
    if (q) {
      const found = tasks.tasks
        .filter((t) => matches(q, t.title, t.notes, ...(t.subtasks ?? []).map((s) => s.title)))
        .sort((a, b) => Number(a.done) - Number(b.done))
        .slice(0, 6)
      for (const t of found)
        out.push({
          id: `task-${t.id}`,
          group: 'Tasks',
          label: t.title,
          detail: t.done ? 'Done' : t.due ? dueText(t.due, t.dueAllDay) : categoryLabel[t.category],
          icon: CheckCircle2,
          run: () => open({ type: 'task', id: t.id }),
        })
      for (const c of courses.items.filter((c) => matches(q, c.name, c.code)).slice(0, 4))
        out.push({ id: `course-${c.id}`, group: 'Courses', label: c.name, detail: c.code || undefined, icon: GraduationCap, run: () => open({ type: 'course', id: c.id }) })
      const seen = new Set<string>()
      for (const a of agenda.filter((a) => a.kind !== 'task' && matches(q, a.title, a.context))) {
        if (seen.has(a.title) || seen.size >= 5) continue
        seen.add(a.title)
        const target: EditorTarget | null =
          a.source === 'assignment' ? { type: 'deadline', id: a.id } : a.source === 'event' ? (a.kind === 'exam' ? { type: 'exam', id: a.id } : { type: 'event', id: a.id }) : null
        out.push({
          id: `agenda-${a.id}`,
          group: a.kind === 'exam' ? 'Exams' : a.kind === 'class' ? 'Classes' : 'Calendar',
          label: a.title,
          detail: [a.context, countdown(a.date)].filter(Boolean).join(' · '),
          icon: a.kind === 'exam' ? ClipboardCheck : CalendarPlus,
          run: () => (target ? open(target) : go(a.kind === 'exam' ? 'exams' : 'calendar')),
        })
      }
    }
    // Typing a task ("Buy ink friday at 10"): Add task comes first. One or two words that match something
    // ("macro", "settings") are a search: matches first, Add task last.
    if (addItem) {
      if (q.split(/\s+/).length <= 2 && out.length) out.push(addItem)
      else out.unshift(addItem)
    }
    return out
  })()

  useEffect(() => {
    if (palette) requestAnimationFrame(() => input.current?.focus())
  }, [palette])

  useEffect(() => {
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(items.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      items[active]?.run()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }

  let lastGroup = ''
  return (
    <AnimatePresence>
      {palette && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-[var(--scrim)] px-3 pt-[max(env(safe-area-inset-top),1rem)] sm:pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(e) => e.target === e.currentTarget && close()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -8, scale: 0.98, ...blur(4) }}
            animate={{ opacity: 1, y: 0, scale: 1, ...blur(0) }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={spring.snappy}
            className="material flex max-h-[min(34rem,80dvh)] w-full max-w-[38rem] flex-col overflow-hidden rounded-[var(--radius-chrome)]"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search aria-hidden className="size-[18px] shrink-0 text-muted" />
              <input
                ref={input}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                }}
                onKeyDown={onKey}
                placeholder="Search, jump to, or type a task…"
                aria-label="Search or type a command"
                aria-controls="palette-results"
                aria-activedescendant={items[active] ? `palette-${items[active].id}` : undefined}
                className="h-14 min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-faint focus:outline-none sm:text-[1.0625rem]"
              />
              <kbd className="hidden rounded-[0.35rem] bg-fill px-1.5 py-0.5 text-caption text-muted sm:block">Esc</kbd>
            </div>
            <ul ref={list} id="palette-results" role="listbox" className="min-h-0 flex-1 overflow-y-auto p-2">
              {items.map((item, i) => {
                const header = item.group !== lastGroup ? item.group : null
                lastGroup = item.group
                const Icon = item.icon
                return (
                  <li key={item.id} role="presentation">
                    {header && <div className="px-2.5 pt-2.5 pb-1 text-caption font-semibold tracking-wide text-faint uppercase">{header}</div>}
                    <button
                      id={`palette-${item.id}`}
                      role="option"
                      aria-selected={i === active}
                      data-index={i}
                      onMouseMove={() => setActive(i)}
                      onClick={item.run}
                      className={cn(
                        'flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-control)] px-2.5 py-1.5 text-left',
                        i === active ? 'bg-fill-strong' : '',
                      )}
                    >
                      <Icon aria-hidden className={cn('size-[18px] shrink-0', item.id === 'add' ? 'text-accent' : 'text-muted')} strokeWidth={2} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body text-ink">{item.label}</span>
                        {item.detail && <span className="block truncate text-caption text-muted">{item.detail}</span>}
                      </span>
                      {item.keys && <kbd className="rounded-[0.35rem] bg-fill px-1.5 py-0.5 text-caption text-muted">{item.keys}</kbd>}
                      {i === active && <CornerDownLeft aria-hidden className="size-3.5 shrink-0 text-faint" />}
                    </button>
                  </li>
                )
              })}
              {items.length === 0 && <li className="px-3 py-8 text-center text-body text-muted">Nothing matches “{query}”.</li>}
            </ul>
            {!query && (
              <div className="hidden flex-wrap gap-x-4 gap-y-1 border-t border-line px-4 py-2.5 text-caption text-muted sm:flex">
                {SHORTCUTS.map(([k, label]) => (
                  <span key={k} className="inline-flex items-center gap-1.5">
                    <kbd className="rounded-[0.35rem] bg-fill px-1.5 py-0.5 text-ink">{k}</kbd>
                    {label}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
