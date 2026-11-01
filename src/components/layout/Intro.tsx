import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/brand/Logo'

/** Launch moment: the logo draws itself, then lifts away to reveal the dashboard. */
export function Intro() {
  const reduce = useReducedMotion()
  const [visible, setVisible] = useState(!reduce)

  useEffect(() => {
    if (!visible) return
    const t = window.setTimeout(() => setVisible(false), 1300)
    return () => window.clearTimeout(t)
  }, [visible])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-bg"
          exit={{ opacity: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }}
        >
          <motion.div exit={{ scale: 0.6, y: -40, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }}>
            <Logo animated className="size-28" />
          </motion.div>
          <motion.span
            className="font-serif text-3xl text-ink"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.75, duration: 0.4 } }}
            exit={{ opacity: 0 }}
          >
            dash
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
