import { useState } from 'react'

function measure(): string {
  const probe = document.createElement('div')
  probe.style.cssText = 'position:fixed;top:0;left:0;visibility:hidden;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)'
  document.body.appendChild(probe)
  const cs = getComputedStyle(probe)
  const top = Math.round(parseFloat(cs.paddingTop))
  const bottom = Math.round(parseFloat(cs.paddingBottom))
  probe.remove()
  const vv = window.visualViewport
  return (
    `top ${top} · bottom ${bottom} · page ${window.innerWidth}×${window.innerHeight} · screen ${screen.width}×${screen.height}` +
    (vv ? ` · offset ${Math.round(vv.offsetTop)}` : '')
  )
}

/**
 * What the phone reports about the screen, for fixing the area behind the Dynamic Island:
 * the top safe-area inset CSS sees, and how much of the screen the page gets.
 */
export function ScreenCheck() {
  const [text] = useState(measure)
  return <p className="px-1 text-caption text-faint tabular-nums">Screen: {text}</p>
}
