export type TaskCategory = 'college' | 'personal' | 'projects'

export interface Task {
  id: string
  title: string
  category: TaskCategory
  done: boolean
  createdAt: string
}

export interface CourseLink {
  label: string
  url: string
  kind: 'portal' | 'materials' | 'video'
}

export interface Course {
  id: string
  code: string
  name: string
  instructor: string
  /** 0–1, share of the syllabus completed */
  progress: number
  schedule: string
  links: CourseLink[]
}

export interface Assignment {
  id: string
  courseId: string
  title: string
  /** ISO timestamp */
  due: string
  kind: 'assignment' | 'exam' | 'quiz'
  submitted: boolean
}

export interface CalendarEvent {
  id: string
  title: string
  /** ISO timestamp */
  start: string
  allDay?: boolean
  location?: string
  kind: 'event' | 'reminder'
}

export type AgendaKind = 'assignment' | 'exam' | 'quiz' | 'event' | 'reminder'

/** Assignments and events merged into one chronological stream. */
export interface AgendaItem {
  id: string
  source: 'assignment' | 'event'
  title: string
  date: Date
  kind: AgendaKind
  context?: string
  allDay?: boolean
}

export interface Weather {
  location: string
  tempC: number
  highC: number
  lowC: number
  condition: 'clear' | 'partly-cloudy' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm'
  summary: string
}

export interface Place {
  name: string
  latitude: number
  longitude: number
}

export interface Profile {
  name: string
  /** Weather location; when unset the device location is used. */
  place?: Place
}

/** What the editor sheet is showing. A missing id means "create new". */
export type EditorTarget =
  | { type: 'course'; id?: string }
  | { type: 'deadline'; id?: string; courseId?: string }
  | { type: 'event'; id?: string }
  | { type: 'settings' }
