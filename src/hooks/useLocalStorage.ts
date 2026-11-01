import { useEffect, useState } from 'react'

function read<T>(key: string): T | undefined {
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? undefined : (JSON.parse(raw) as T)
  } catch {
    return undefined
  }
}

/** State mirrored to localStorage; `undefined` means nothing was stored yet. */
export function useLocalStorage<T>(key: string) {
  const [value, setValue] = useState<T | undefined>(() => read<T>(key))

  useEffect(() => {
    if (value === undefined) return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage full or blocked: keep working in memory.
    }
  }, [key, value])

  return [value, setValue] as const
}
