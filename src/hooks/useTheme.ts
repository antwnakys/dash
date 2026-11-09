import { registerPlugin } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { useEffect, useState } from 'react'
import { isNative } from '@/lib/native'
import type { LookPreference, ThemePreference } from '@/types'
import { useLocalStorage } from './useLocalStorage'

/** Native side in ios/App/App/SceneDelegate.swift: matches iOS's colours behind the page to dash's theme. */
const DashTheme = registerPlugin<{ set(options: { style: ThemePreference }): Promise<void> }>('DashTheme')

const media = () => window.matchMedia('(prefers-color-scheme: dark)')
/** Computers (a mouse or trackpad that can hover): the Mac app and desktop browsers. Same test as index.html. */
const isComputer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches

/**
 * Light/dark preference: applied to <html data-theme> and the iOS status bar. Plus the design (`look`): Graphite or
 * Classic, chosen per device (not synced); Automatic = Graphite on computers, Classic on phones. On <html data-look>.
 */
export function useTheme() {
  const [storedLook, setStoredLook] = useLocalStorage<LookPreference>('dash.look.v1')
  const lookPreference = storedLook ?? 'auto'
  const look = lookPreference === 'auto' ? (isComputer() ? 'graphite' : 'classic') : lookPreference
  useEffect(() => {
    if (look !== 'classic') document.documentElement.dataset.look = look
    else delete document.documentElement.dataset.look
  }, [look])

  const [stored, setStored] = useLocalStorage<ThemePreference>('dash.theme.v1')
  const preference = stored ?? 'system'
  const [systemDark, setSystemDark] = useState(() => media().matches)

  useEffect(() => {
    const m = media()
    const onChange = () => setSystemDark(m.matches)
    m.addEventListener('change', onChange)
    return () => m.removeEventListener('change', onChange)
  }, [])

  const resolved: 'light' | 'dark' = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    const root = document.documentElement
    if (preference === 'system') delete root.dataset.theme
    else root.dataset.theme = preference
    if (isNative) {
      // Older app builds don't have DashTheme yet; that only means the native colours follow the phone.
      DashTheme.set({ style: preference }).catch(() => {})
      StatusBar.setStyle({ style: resolved === 'dark' ? Style.Dark : Style.Light }).catch(() => {})
    }
  }, [preference, resolved])

  return {
    preference,
    resolved,
    setPreference: (p: ThemePreference) => setStored(p),
    look: { preference: lookPreference, resolved: look as 'graphite' | 'classic', setPreference: (p: LookPreference) => setStoredLook(p) },
  }
}
