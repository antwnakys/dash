/**
 * Quick add from outside dash. Text arrives as:
 * - `dash://add?text=…` in the iPhone app (an iOS Shortcut in the Share menu opens it; `@capacitor/app` hears it);
 * - `?add=…` on the website or in the Mac app (bookmarklets, other apps, the Shortcut's web fallback);
 * - the Mac's global shortcut (⌃⌥Space → menu-bar event `quick-add`, see `onMenuBar`).
 * dash then opens the ⌘K box with the text filled in, so quick add reads the date and you confirm with Enter.
 */
import { isNative } from './native'

/** "dash://add?text=Read%20this" or "https://…/dash/?add=…" → the text, if there is any. */
export function textFromLink(url: string): string | undefined {
  try {
    const u = new URL(url)
    const text = u.searchParams.get('text') ?? u.searchParams.get('add') ?? u.searchParams.get('url')
    return text?.trim() || undefined
  } catch {
    return undefined
  }
}

/** Calls `onText` for text handed to dash at start-up or while it runs. Returns a stop function. */
export function listenForAddLinks(onText: (text: string) => void): () => void {
  // Website / Mac: ?add=… once, then clean the address so a reload doesn't add it again.
  const fromPage = new URLSearchParams(location.search).get('add')?.trim()
  if (fromPage) {
    const clean = new URL(location.href)
    clean.searchParams.delete('add')
    history.replaceState(null, '', clean.toString())
    setTimeout(() => onText(fromPage), 300)
  }
  if (!isNative) return () => {}
  let stop: (() => void) | undefined
  let gone = false
  void import('@capacitor/app')
    .then(async ({ App }) => {
      const launch = await App.getLaunchUrl().catch(() => undefined)
      const first = launch?.url && textFromLink(launch.url)
      if (first) setTimeout(() => onText(first), 300)
      const handle = await App.addListener('appUrlOpen', ({ url }) => {
        const text = textFromLink(url)
        if (text) onText(text)
      })
      if (gone) void handle.remove()
      else stop = () => void handle.remove()
    })
    .catch(() => {}) // An app build without the plugin: links just open dash.
  return () => {
    gone = true
    stop?.()
  }
}
