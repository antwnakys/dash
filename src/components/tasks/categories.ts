import type { TaskCategory } from '@/types'

export const categoryLabel: Record<TaskCategory, string> = {
  college: 'College',
  personal: 'Personal',
  projects: 'Projects',
}

export const categories = Object.keys(categoryLabel) as TaskCategory[]
