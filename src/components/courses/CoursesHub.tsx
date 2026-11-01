import { Plus } from 'lucide-react'
import { useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Panel } from '@/components/ui/Panel'
import { useDashboard } from '@/context/DashboardContext'
import { useNow } from '@/hooks/useNow'
import { cn } from '@/lib/cn'
import { CourseCard } from './CourseCard'

export function CoursesHub({ variant = 'compact' }: { variant?: 'compact' | 'full' }) {
  const { courses: courseList, assignments, openEditor, loadSample } = useDashboard()
  const courses = courseList.items
  const now = useNow(60_000)

  const pendingByCourse = useMemo(() => {
    const open = assignments.items
      .filter((a) => !a.submitted && new Date(a.due) > now)
      .sort((a, b) => a.due.localeCompare(b.due))
    return new Map(courses.map((c) => [c.id, open.filter((a) => a.courseId === c.id)]))
  }, [courses, assignments, now])

  const totalDue = [...pendingByCourse.values()].reduce((n, list) => n + list.length, 0)

  return (
    <Panel
      title="Courses"
      meta={courses.length > 0 && `${totalDue} ${totalDue === 1 ? 'deadline' : 'deadlines'} open`}
      action={<IconButton icon={Plus} label="Add course" onClick={() => openEditor({ type: 'course' })} />}
    >
      {courses.length === 0 && (
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-line-strong p-5">
          <p className="max-w-sm text-sm text-muted">
            Add your courses to track syllabus progress, deadlines and exams in one place.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => openEditor({ type: 'course' })}>
              Add course
            </Button>
            <Button onClick={loadSample}>Try sample data</Button>
          </div>
        </div>
      )}
      <div className={cn('grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2', variant === 'full' && 'xl:grid-cols-3')}>
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} pending={pendingByCourse.get(course.id) ?? []} now={now} />
        ))}
      </div>
    </Panel>
  )
}
