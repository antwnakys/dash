import { CalendarDays, CheckSquare, GraduationCap, LayoutGrid, type LucideIcon } from 'lucide-react'
import type { ComponentType } from 'react'
import { CalendarView } from './CalendarView'
import { CoursesView } from './CoursesView'
import { OverviewView } from './OverviewView'
import { TasksView } from './TasksView'

export type ViewId = 'overview' | 'courses' | 'tasks' | 'calendar'

export const views: Array<{ id: ViewId; label: string; icon: LucideIcon; component: ComponentType }> = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid, component: OverviewView },
  { id: 'courses', label: 'Courses', icon: GraduationCap, component: CoursesView },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, component: TasksView },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, component: CalendarView },
]
