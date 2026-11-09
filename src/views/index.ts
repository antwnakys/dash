import { CalendarDays, CheckCircle2, ClipboardCheck, FolderKanban, GraduationCap, Sun, Target, type LucideIcon } from 'lucide-react'
import type { ComponentType } from 'react'
import { CalendarView } from './CalendarView'
import { CoursesView } from './CoursesView'
import { ExamsView } from './ExamsView'
import { GoalsView } from './GoalsView'
import { ProjectsView } from './ProjectsView'
import { TasksView } from './TasksView'
import { TodayView } from './TodayView'

export type ViewId = 'today' | 'courses' | 'exams' | 'tasks' | 'calendar' | 'projects' | 'goals'

export const views: Array<{ id: ViewId; label: string; icon: LucideIcon; component: ComponentType }> = [
  { id: 'today', label: 'Today', icon: Sun, component: TodayView },
  { id: 'tasks', label: 'Tasks', icon: CheckCircle2, component: TasksView },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, component: CalendarView },
  { id: 'courses', label: 'Courses', icon: GraduationCap, component: CoursesView },
  { id: 'exams', label: 'Exams', icon: ClipboardCheck, component: ExamsView },
  { id: 'projects', label: 'Projects', icon: FolderKanban, component: ProjectsView },
  { id: 'goals', label: 'Goals', icon: Target, component: GoalsView },
]

/** On phones the tab bar holds these; the rest sit behind More. */
export const phoneTabs: ViewId[] = ['today', 'tasks', 'calendar', 'courses']
