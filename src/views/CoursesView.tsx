import { Plus } from 'lucide-react'
import { CourseCard } from '@/components/courses/CourseCard'
import { usePendingByCourse } from '@/components/courses/usePendingByCourse'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card } from '@/components/ui/Section'
import { useDashboard } from '@/context/DashboardContext'
import { useNow } from '@/hooks/useNow'

export function CoursesView() {
  const { courses, openEditor, loadSample } = useDashboard()
  const now = useNow(60_000)
  const pending = usePendingByCourse(now)
  const open = [...pending.values()].reduce((n, l) => n + l.length, 0)
  const avg = courses.items.length ? Math.round((courses.items.reduce((s, c) => s + c.progress, 0) / courses.items.length) * 100) : 0

  return (
    <>
      <PageHeader
        eyebrow="This semester"
        title="Courses"
        summary={
          courses.items.length > 0 &&
          `${courses.items.length} ${courses.items.length === 1 ? 'course' : 'courses'}, ${open} open ${open === 1 ? 'deadline' : 'deadlines'}, ${avg}% through on average.`
        }
        aside={
          <Button variant="primary" onClick={() => openEditor({ type: 'course' })}>
            <Plus aria-hidden className="size-4" strokeWidth={2.4} />
            Add course
          </Button>
        }
      />
      {courses.items.length === 0 ? (
        <Card>
          <EmptyState message="Add your courses to follow syllabus progress, deadlines and exams in one place.">
            <Button variant="primary" size="sm" onClick={() => openEditor({ type: 'course' })}>
              Add course
            </Button>
            <Button size="sm" onClick={loadSample}>
              Try sample data
            </Button>
          </EmptyState>
        </Card>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.items.map((c) => (
            <CourseCard key={c.id} course={c} pending={pending.get(c.id) ?? []} now={now} />
          ))}
        </div>
      )}
    </>
  )
}
