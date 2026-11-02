import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react'
import { sampleData } from '@/data/sample'
import { useCalendarSync, type CalendarSync } from '@/hooks/useCalendarSync'
import { useCloudSync, type CloudSync } from '@/hooks/useCloudSync'
import { useCollection, type Collection } from '@/hooks/useCollection'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useTasks, type TasksApi } from '@/hooks/useTasks'
import { useTheme } from '@/hooks/useTheme'
import { useWeather, type WeatherState } from '@/hooks/useWeather'
import { EXAM, isClass, matchCourse } from '@/lib/campus'
import { startOfDay } from '@/lib/date'
import type { ViewId } from '@/views'
import type { AgendaItem, Assignment, CalendarEvent, Course, EditorTarget, Profile, ThemePreference } from '@/types'

export interface Toast {
  id: number
  message: string
  tone?: 'default' | 'error'
}

interface DashboardValue {
  profile: Profile
  setProfile: (patch: Partial<Profile>) => void
  courses: Collection<Course>
  assignments: Collection<Assignment>
  events: Collection<CalendarEvent>
  tasks: TasksApi
  calendar: CalendarSync
  /** Syncs this device's data with every other device signed in to the same Google account. */
  cloud: CloudSync
  weather: WeatherState
  /** Open assignments and events in one chronological list. */
  agenda: AgendaItem[]
  selectedDate: Date
  setSelectedDate: (d: Date) => void
  editor: EditorTarget | null
  openEditor: (target: EditorTarget) => void
  closeEditor: () => void
  loadSample: () => void
  clearAll: () => void
  theme: { preference: ThemePreference; resolved: 'light' | 'dark'; setPreference: (p: ThemePreference) => void }
  toast: Toast | null
  /** Brief confirmation or error shown above the navigation. */
  notify: (message: string, tone?: Toast['tone']) => void
  dismissToast: () => void
  view: ViewId
  setView: (v: ViewId) => void
}

const DashboardContext = createContext<DashboardValue | null>(null)

function buildAgenda(
  courses: Course[],
  assignments: Assignment[],
  events: CalendarEvent[],
  synced: CalendarEvent[],
): AgendaItem[] {
  const courseCode = new Map(courses.map((c) => [c.id, c.code]))
  // Events at campus (Sorou 74, Marousi) are classes: marked as a course and linked to one when the title matches.
  const asClass = (e: CalendarEvent): Partial<AgendaItem> | null => {
    if (!isClass(e)) return null
    const course = matchCourse(e.title, courses)
    return { kind: 'class', courseId: course?.id, context: [course?.code, e.location?.split(',')[0]].filter(Boolean).join(' · ') }
  }
  return [
    ...assignments
      .filter((a) => !a.submitted)
      .map<AgendaItem>((a) => ({
        id: a.id,
        source: 'assignment',
        title: a.title,
        date: new Date(a.due),
        kind: a.kind,
        context: courseCode.get(a.courseId),
      })),
    ...events.map<AgendaItem>((e) => ({
      id: e.id,
      source: 'event',
      title: e.title,
      date: new Date(e.start),
      kind: e.kind,
      context: e.location,
      allDay: e.allDay,
      ...asClass(e),
    })),
    ...synced.map<AgendaItem>((e) => ({
      id: e.id,
      source: 'calendar',
      title: e.title,
      date: new Date(e.start),
      kind: EXAM.test(e.title) ? 'exam' : 'event',
      context: e.location,
      allDay: e.allDay,
      ...asClass(e),
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime())
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [storedProfile, setStoredProfile] = useLocalStorage<Profile>('dash.profile.v1')
  const profile = storedProfile ?? { name: '' }
  const courses = useCollection<Course>('dash.courses.v1')
  const assignments = useCollection<Assignment>('dash.assignments.v1')
  const events = useCollection<CalendarEvent>('dash.events.v1')
  const tasks = useTasks()
  const weather = useWeather(profile.place)
  const calendar = useCalendarSync(profile.calendarUrls)
  const cloud = useCloudSync(Boolean(calendar.google.account))
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))
  const [editor, setEditor] = useState<EditorTarget | null>(null)
  const theme = useTheme()
  const [view, setView] = useState<ViewId>('today')
  const [toast, setToast] = useState<Toast | null>(null)
  const dismissToast = useCallback(() => setToast(null), [])
  const notify = useCallback((message: string, tone: Toast['tone'] = 'default') => setToast({ id: Date.now(), message, tone }), [])

  const setProfile = useCallback(
    (patch: Partial<Profile>) => setStoredProfile((p) => ({ name: '', ...p, ...patch, updatedAt: Date.now() })),
    [setStoredProfile],
  )

  const agenda = useMemo(
    () => buildAgenda(courses.items, assignments.items, events.items, calendar.events),
    [courses.items, assignments.items, events.items, calendar.events],
  )

  const loadSample = useCallback(() => {
    const s = sampleData()
    courses.set(() => s.courses)
    assignments.set(() => s.assignments)
    events.set(() => s.events)
    tasks.replaceAll(s.tasks)
  }, [courses, assignments, events, tasks])

  const clearAll = useCallback(() => {
    courses.set(() => [])
    assignments.set(() => [])
    events.set(() => [])
    tasks.replaceAll([])
  }, [courses, assignments, events, tasks])

  const value: DashboardValue = {
    profile,
    setProfile,
    courses,
    assignments,
    events,
    tasks,
    calendar,
    cloud,
    weather,
    agenda,
    selectedDate,
    setSelectedDate,
    editor,
    openEditor: setEditor,
    closeEditor: () => setEditor(null),
    loadSample,
    clearAll,
    theme,
    toast,
    notify,
    dismissToast,
    view,
    setView,
  }

  return <DashboardContext value={value}>{children}</DashboardContext>
}

export function useDashboard(): DashboardValue {
  const value = use(DashboardContext)
  if (!value) throw new Error('useDashboard must be used inside <DashboardProvider>')
  return value
}
