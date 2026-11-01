import { motion, Reorder, useDragControls } from 'framer-motion'
import { GripVertical, X } from 'lucide-react'
import type { Task } from '@/types'
import { categoryLabel } from './categories'
import { Checkbox } from './Checkbox'

interface TaskItemProps {
  task: Task
  showCategory: boolean
  onToggle: () => void
  onRemove: () => void
}

export function TaskItem({ task, showCategory, onToggle, onRemove }: TaskItemProps) {
  const controls = useDragControls()

  return (
    <Reorder.Item
      value={task}
      dragListener={false}
      dragControls={controls}
      layout="position"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.18 } }}
      whileDrag={{ scale: 1.02, boxShadow: 'var(--shadow-float)', zIndex: 10, borderRadius: 14 }}
      className="group relative list-none bg-surface"
    >
      <div className="flex min-h-[3.25rem] items-center gap-3 py-2 pr-2 pl-1">
        <button
          type="button"
          aria-label={`Reorder “${task.title}”`}
          onPointerDown={(e) => controls.start(e)}
          className="flex h-9 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-faint opacity-50 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing lg:opacity-0"
        >
          <GripVertical aria-hidden className="size-4" />
        </button>

        <Checkbox checked={task.done} onToggle={onToggle} label={task.title} />

        <div className="ml-2 flex min-w-0 flex-1 flex-col">
          <span className="relative w-fit max-w-full">
            <span className={`block truncate text-body transition-colors duration-300 ${task.done ? 'text-faint' : 'text-ink'}`}>
              {task.title}
            </span>
            <motion.span
              aria-hidden
              className="absolute top-1/2 left-0 h-px w-full origin-left bg-faint"
              initial={false}
              animate={{ scaleX: task.done ? 1 : 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            />
          </span>
          {showCategory && <span className="text-subhead text-muted">{categoryLabel[task.category]}</span>}
        </div>

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Delete “${task.title}”`}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-faint transition hover:bg-fill hover:text-ink focus-visible:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
    </Reorder.Item>
  )
}
