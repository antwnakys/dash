import type { CourseColor } from '@/types'

/** Restrained identifiers that read in light and dark. */
export const courseColors: Record<CourseColor, string> = {
  slate: '#7a7f88',
  blue: 'var(--accent)',
  green: 'var(--course)',
  amber: '#c58a1b',
  red: 'var(--danger)',
  violet: '#7c5cc4',
}

export const courseColorNames: Record<CourseColor, string> = {
  slate: 'Graphite',
  blue: 'Blue',
  green: 'Green',
  amber: 'Amber',
  red: 'Red',
  violet: 'Violet',
}
