export type TaskCategory = 'college' | 'personal' | 'projects'

/** 1 = high, 2 = medium, 3 = low; missing = no priority. */
export type TaskPriority = 1 | 2 | 3
export type TaskRepeat = 'daily' | 'weekdays' | 'weekly' | 'monthly'

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  category: TaskCategory
  done: boolean
  createdAt: string
  /** When it's due (ISO); with `dueAllDay` only the date counts. */
  due?: string
  dueAllDay?: boolean
  // Everything below is optional so older app versions keep syncing these tasks.
  priority?: TaskPriority
  notes?: string
  subtasks?: Subtask[]
  /** Ticking a repeating task files it as done and adds the next one. */
  repeat?: TaskRepeat
  /** When it was ticked off (ISO). */
  completedAt?: string
}

export interface CourseLink {
  label: string
  url: string
  /** `other`: a resource the user named (slides, reading list, drive folder…). */
  kind: 'portal' | 'materials' | 'video' | 'meeting' | 'other'
}

/** A course's identifying colour (a dot on cards, lists and the calendar). */
export type CourseColor = 'slate' | 'blue' | 'green' | 'amber' | 'red' | 'violet'

/** One recurring class time: the weekdays it meets (0 = Sunday … 6 = Saturday) and its local times. */
export interface CourseMeeting {
  days: number[]
  /** "HH:MM" */
  start: string
  /** "HH:MM" */
  end?: string
}

export interface Course {
  id: string
  code: string
  name: string
  instructor: string
  /** 0–1, share of the syllabus completed */
  progress: number
  /** Readable schedule, e.g. "Tue & Thu 13:00–14:30"; written from `meetings` when they exist. */
  schedule: string
  meetings?: CourseMeeting[]
  /** First and last day of classes, "YYYY-MM-DD". */
  term?: { start?: string; end?: string }
  links: CourseLink[]
  // Optional, so older versions keep syncing courses.
  color?: CourseColor
  /** Free notes: exam format, what the teacher said, office hours… */
  notes?: string
}

export interface Assignment {
  id: string
  courseId: string
  title: string
  /** ISO timestamp */
  due: string
  kind: 'assignment' | 'exam' | 'quiz'
  submitted: boolean
  /** Mark received; out of `outOf` (10 by default, the Greek scale). */
  grade?: number
  outOf?: number
}

/** One study session for an exam: planned by dash, or a tick on a study event from the calendar. */
export interface StudySession {
  /** `<examId>@<start>` for planned sessions, the calendar event id for calendar ones. */
  id: string
  examId: string
  /** ISO timestamp */
  start: string
  minutes: number
  topic?: string
  done: boolean
  fromCalendar?: boolean
}

/**
 * How an exam went, entered after it. Kept apart from the exam itself (which may be a Google Calendar event
 * that later disappears), with the subject and date copied in so the history stays complete.
 */
export interface ExamResult {
  /** The exam's id: calendar event, exam added in dash, or exam-type deadline. */
  id: string
  subject: string
  /** ISO timestamp of the exam. */
  date: string
  allDay?: boolean
  score?: number
  outOf?: number
  /** Missing: not said (e.g. skipped without a result). */
  passed?: boolean
  courseId?: string
}

/** A finished focus session (Focus mode), synced so study time adds up across devices. */
export interface FocusSession {
  id: string
  /** ISO timestamp of the start. */
  start: string
  minutes: number
  taskId?: string
  courseId?: string
}

export interface CalendarEvent {
  id: string
  title: string
  /** ISO timestamp */
  start: string
  /** ISO timestamp; synced calendar events only */
  end?: string
  allDay?: boolean
  location?: string
  /** Teams / Zoom / Meet link found in the event. */
  link?: string
  /** Any other web link in the event's notes (a practice site, slides…). */
  url?: string
  /** Taken online (says so, or has a meeting link): no trip to campus. */
  online?: boolean
  /** `exam`: an exam added in dash from + → Exam. */
  kind: 'event' | 'reminder' | 'exam'
}

/** `class`: a lesson at the campus address saved in Settings, marked as a course. */
export type AgendaKind = 'assignment' | 'exam' | 'quiz' | 'event' | 'reminder' | 'class' | 'task'

/** Assignments and events merged into one chronological stream. */
export interface AgendaItem {
  id: string
  source: 'assignment' | 'event' | 'calendar' | 'task'
  title: string
  date: Date
  /** When it ends, if known (synced calendar events). */
  end?: Date
  kind: AgendaKind
  context?: string
  allDay?: boolean
  /** The course a class belongs to, when its title matches one. */
  courseId?: string
  /** Meeting link, for online lessons. */
  link?: string
  /** Other web link from the event (shown as a button on exams). */
  url?: string
  online?: boolean
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
  /** Follow this device's location for the weather, refreshed each time dash opens. Missing means on. */
  autoLocation?: boolean
  /** Door-to-door minutes from home to campus; unset means the default in lib/commute.ts. */
  commuteMinutes?: number
  /** Where classes happen. Calendar events here count as classes; `place` is the area for the trip weather. */
  campus?: { address: string; place?: Place }
  /** Home area, for the trip weather. */
  home?: Place
  /** The train you take to campus ("17:11"); unset means the defaults in lib/commute.ts. */
  suburbanTrains?: string[]
  /** Phone reminders (iPhone app). Missing flags count as on. */
  reminders?: { leave?: boolean; deadlines?: boolean; metroCard?: boolean; appExpiry?: boolean }
  /** Sections hidden from the Today page (Settings → Today page). */
  todayHidden?: TodaySection[]
  /** Order of the dashboard widgets (Settings → Today page). */
  widgetOrder?: DashWidget[]
  /** Google Calendar secret iCal addresses (or any iCal feed) to sync. */
  calendarUrls?: string[]
  /** When the profile last changed, for sync. */
  updatedAt?: number
}

/** What the editor sheet is showing. A missing id means "create new". */
export type EditorTarget =
  | { type: 'course'; id?: string }
  | { type: 'deadline'; id?: string; courseId?: string }
  | { type: 'event'; id?: string }
  | { type: 'exam'; id?: string }
  | { type: 'examResult'; id: string; subject: string; date: string; allDay?: boolean; courseId?: string; source?: 'assignment' | 'event' | 'calendar' | 'task' }
  | { type: 'task'; id?: string }
  | { type: 'new' }
  | { type: 'review' }
  | { type: 'settings'; section?: 'calendar' | 'commute' | 'today' }

export type TodaySection =
  | 'focus'
  | 'upnext'
  | 'week'
  | 'calendar'
  | 'courses'
  // Obsidian dashboard
  | 'goals'
  | 'timeline'
  | 'academic'
  | DashWidget

/** Widgets in the Obsidian dashboard's top row, in the order Settings sets. */
export type DashWidget = 'study' | 'completion' | 'weekfocus' | 'deadlines'

export type ThemePreference = 'system' | 'light' | 'dark'
/** The design: `auto` = Graphite on computers, Classic on phones. */
export type LookPreference = 'auto' | 'obsidian' | 'graphite' | 'classic'
