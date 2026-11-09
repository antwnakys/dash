/**
 * The launch moment (components/layout/Intro.tsx) plays once per browser session. Screens time their own
 * entrance to start as it clears, instead of playing unseen underneath it.
 */
const SEEN = 'dash.intro.seen'
/** How long the logo stays before it clears. */
export const INTRO_MS = 1150

const startedAt = typeof performance !== 'undefined' ? performance.now() : 0
const planned = (() => {
  try {
    return sessionStorage.getItem(SEEN) !== '1' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
})()

export const introPlanned = () => planned

export function markIntroSeen() {
  try {
    sessionStorage.setItem(SEEN, '1')
  } catch {
    // Not critical.
  }
}

/** Seconds until the intro clears (0 once it has, or when it doesn't play). */
export function introDelay(): number {
  if (!planned) return 0
  return Math.max(0, INTRO_MS - (performance.now() - startedAt)) / 1000
}
