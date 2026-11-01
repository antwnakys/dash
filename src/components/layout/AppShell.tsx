import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { EditorSheet } from '@/components/editor/EditorSheet'
import { ToastHost } from '@/components/ui/Toast'
import { useDashboard } from '@/context/DashboardContext'
import { views } from '@/views'
import { Intro } from './Intro'
import { Sidebar } from './Sidebar'
import { TabBar } from './TabBar'

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))

export function AppShell() {
  const { view, setView, editor, openEditor, dismissToast } = useDashboard()
  const View = views.find((v) => v.id === view)!.component

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [view])

  // Keyboard: N opens New, 1–4 switch sections.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editor || e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        openEditor({ type: 'new' })
      }
      const index = Number(e.key) - 1
      if (views[index]) setView(views[index].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editor, openEditor, setView])

  return (
    <div className="relative min-h-dvh">
      {/* Keeps the iOS status bar legible as content scrolls under it. */}
      <div aria-hidden className="fixed inset-x-0 top-0 z-30 h-[env(safe-area-inset-top)] bg-bg/80 backdrop-blur-xl" />
      <Sidebar />
      <main className="lg:pl-[15.5rem]">
        <div className="mx-auto w-full max-w-[70rem] px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-36 sm:px-6 lg:px-10 lg:pt-11 lg:pb-16">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <View />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <TabBar />
      <EditorSheet />
      <ToastHost onDismiss={dismissToast} />
      <Intro />
    </div>
  )
}
