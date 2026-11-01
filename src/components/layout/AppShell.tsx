import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { EditorSheet } from '@/components/editor/EditorSheet'
import { Header } from '@/components/header/Header'
import { views, type ViewId } from '@/views'
import { Intro } from './Intro'
import { Nav } from './Nav'

export function AppShell() {
  const [active, setActive] = useState<ViewId>('overview')
  const View = views.find((v) => v.id === active)!.component

  return (
    <div className="relative isolate min-h-dvh">
      {/* A faint accent glow gives the frosted panels something to blur. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_15%_-10%,rgb(122_162_255/0.09),transparent_70%),radial-gradient(40rem_30rem_at_100%_100%,rgb(122_162_255/0.04),transparent_70%)]"
      />
      <Nav
        active={active}
        onChange={(id) => {
          setActive(id)
          window.scrollTo({ top: 0 })
        }}
      />
      <main className="mx-auto flex min-w-0 max-w-[1360px] flex-col gap-8 px-4 pt-[max(2rem,calc(env(safe-area-inset-top)+1rem))] pb-28 sm:px-6 sm:pt-12 lg:pr-10 lg:pb-12 lg:pl-28">
        <Header />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <View />
          </motion.div>
        </AnimatePresence>
      </main>
      <EditorSheet />
      <Intro />
    </div>
  )
}
