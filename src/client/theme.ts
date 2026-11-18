import { useSyncExternalStore } from 'react'

interface ThemeSnapshot {
  active: {
    colorScheme: 'light' | 'dark'
  }
}

interface ThemeContext {
  theme?: {
    getTheme(): ThemeSnapshot
  }
  on(
    event: 'theme/change',
    listener: (snapshot: ThemeSnapshot) => void,
  ): unknown
}

let dark = false
const listeners = new Set<() => void>()

function publish(snapshot: ThemeSnapshot): void {
  const next = snapshot.active.colorScheme === 'dark'
  if (dark === next) return
  dark = next
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): boolean {
  return dark
}

export function bindTheme(ctx: unknown): void {
  const context = ctx as ThemeContext
  if (context.theme === undefined) return
  publish(context.theme.getTheme())
  context.on('theme/change', publish)
}

export function useDarkTheme(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
