import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react'
import { sampleData } from '@/data/sample'
import { useCollection, type Collection } from '@/hooks/useCollection'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useTasks, type TasksApi } from '@/hooks/useTasks'
import { useWeather, type WeatherState } from '@/hooks/useWeather'
import { startOfDay } from '@/lib/date'
import type { AgendaItem, Assignment, CalendarEvent, Course, EditorTarget, Profile } from '@/types'

interface DashboardValue {
  profile: Profile
  setProfile: (patch: Partial<Profile>) => void
  courses: Collection<Course>
  assignments: Collection<Assignment>
  events: Collection<CalendarEvent>
  tasks: TasksApi
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
}

const DashboardContext = createContext<DashboardValue | null>(null)

function buildAgenda(courses: Course[], assignments: Assignment[], events: CalendarEvent[]): AgendaItem[] {
  const courseCode = new Map(courses.map((c) => [c.id, c.code]))
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
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))
  const [editor, setEditor] = useState<EditorTarget | null>(null)

  const setProfile = useCallback(
    (patch: Partial<Profile>) => setStoredProfile((p) => ({ name: '', ...p, ...patch })),
    [setStoredProfile],
  )

  const agenda = useMemo(
    () => buildAgenda(courses.items, assignments.items, events.items),
    [courses.items, assignments.items, events.items],
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
    weather,
    agenda,
    selectedDate,
    setSelectedDate,
    editor,
    openEditor: setEditor,
    closeEditor: () => setEditor(null),
    loadSample,
    clearAll,
  }

  return <DashboardContext value={value}>{children}</DashboardContext>
}

export function useDashboard(): DashboardValue {
  const value = use(DashboardContext)
  if (!value) throw new Error('useDashboard must be used inside <DashboardProvider>')
  return value
}
