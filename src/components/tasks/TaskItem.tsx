import { motion, Reorder, useDragControls } from 'framer-motion'
import { GripVertical, X } from 'lucide-react'
import { cn } from '@/lib/cn'
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
      exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
      whileDrag={{ scale: 1.02, boxShadow: '0 12px 32px -12px rgb(0 0 0 / 0.6)', zIndex: 10 }}
      className="group relative list-none rounded-xl bg-raised/0"
    >
      <div className="flex items-center gap-2 rounded-xl py-2 pr-1 pl-0.5 transition-colors group-hover:bg-white/[0.03]">
        <button
          aria-label={`Reorder “${task.title}”`}
          onPointerDown={(e) => controls.start(e)}
          className="flex h-8 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-faint opacity-40 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
        >
          <GripVertical aria-hidden className="size-4" />
        </button>

        <Checkbox checked={task.done} onToggle={onToggle} label={task.title} />

        <div className="flex min-w-0 flex-1 flex-col pl-1.5">
          <span className="relative w-fit max-w-full">
            <motion.span
              animate={{ color: task.done ? 'var(--color-faint)' : 'var(--color-ink)' }}
              className="block truncate text-sm"
            >
              {task.title}
            </motion.span>
            <motion.span
              aria-hidden
              className="absolute top-1/2 left-0 h-px w-full origin-left bg-faint"
              initial={false}
              animate={{ scaleX: task.done ? 1 : 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            />
          </span>
          {showCategory && <span className="text-xs text-faint">{categoryLabel[task.category]}</span>}
        </div>

        <button
          onClick={onRemove}
          aria-label={`Delete “${task.title}”`}
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg text-faint transition',
            'opacity-0 group-hover:opacity-100 hover:bg-white/[0.06] hover:text-ink focus-visible:opacity-100 max-sm:opacity-60',
          )}
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
    </Reorder.Item>
  )
}
