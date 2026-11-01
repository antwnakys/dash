import { StatusBar, Style } from '@capacitor/status-bar'
import { useEffect, useState } from 'react'
import { isNative } from '@/lib/native'
import type { ThemePreference } from '@/types'
import { useLocalStorage } from './useLocalStorage'

const media = () => window.matchMedia('(prefers-color-scheme: dark)')

/** Light/dark preference: applied to <html data-theme> and the iOS status bar. */
export function useTheme() {
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
    if (isNative) StatusBar.setStyle({ style: resolved === 'dark' ? Style.Dark : Style.Light }).catch(() => {})
  }, [preference, resolved])

  return { preference, resolved, setPreference: (p: ThemePreference) => setStored(p) }
}
