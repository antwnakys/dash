import { useState } from 'react'
import { Segmented } from '@/components/ui/Segmented'
import { useDashboard } from '@/context/DashboardContext'
import type { EditorTarget } from '@/types'
import { CourseForm } from './CourseForm'
import { DeadlineForm } from './DeadlineForm'
import { EventForm } from './EventForm'
import { SettingsForm } from './SettingsForm'
import { Sheet } from './Sheet'

const titles = {
  course: ['New course', 'Edit course'],
  deadline: ['New deadline', 'Edit deadline'],
  event: ['New event', 'Edit event'],
} as const

const newKinds = [
  { value: 'deadline' as const, label: 'Deadline' },
  { value: 'event' as const, label: 'Event' },
]

/** The one sheet that hosts every editor; keeps showing the last target while it animates out. */
export function EditorSheet() {
  const { editor, closeEditor } = useDashboard()
  const [shown, setShown] = useState<EditorTarget | null>(editor)
  // Creating from the agenda lets the user switch between a deadline and an event.
  const [newKind, setNewKind] = useState<'deadline' | 'event'>('deadline')

  // Adopt a newly opened target during render (React's "adjust state on prop change" pattern).
  if (editor && editor !== shown) {
    setShown(editor)
    if (editor.type === 'deadline' || editor.type === 'event') setNewKind(editor.type)
  }

  const target = shown
  const isNew = target && target.type !== 'settings' && !target.id
  const type = target && isNew && target.type !== 'course' ? newKind : target?.type

  const title =
    type === 'settings' ? 'Settings' : type ? titles[type][isNew ? 0 : 1] : ''

  return (
    <Sheet open={editor !== null} title={title} onClose={closeEditor}>
      {target && (
        <div key={JSON.stringify(target)} className="flex flex-col gap-4">
          {isNew && target.type !== 'course' && !('courseId' in target && target.courseId) && (
            <Segmented label="What to add" options={newKinds} value={newKind} onChange={setNewKind} className="self-start" />
          )}
          {type === 'course' && <CourseForm id={'id' in target ? target.id : undefined} onDone={closeEditor} />}
          {type === 'deadline' && (
            <DeadlineForm
              key={newKind}
              id={'id' in target ? target.id : undefined}
              courseId={'courseId' in target ? target.courseId : undefined}
              onDone={closeEditor}
            />
          )}
          {type === 'event' && <EventForm key={newKind} id={'id' in target ? target.id : undefined} onDone={closeEditor} />}
          {type === 'settings' && <SettingsForm onDone={closeEditor} />}
        </div>
      )}
    </Sheet>
  )
}
