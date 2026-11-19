import type { Context } from '@deepseek-ai/cordis'
import type { ReactNode } from 'react'
import { NovelViewPage, NovelViewSettings } from './app.tsx'
import { installStyles } from './styles.ts'
import { bindTheme } from './theme.ts'

export const name = 'novelview-client'
export const inject = ['slots', 'theme']

interface SlotRegistry {
  inject(name: string, callback: () => (() => void) | undefined): () => void
  register(spec: Record<string, unknown>, component: unknown): () => void
}

interface LayoutService {
  selectPanel(panelId: string | null): void
}

const MAIN_PANEL_ID = 'novelview'

function NovelViewIcon({ size = 16 }: { size?: number }): ReactNode {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4.5 4.5c0-1.1.9-2 2-2H20v16H6.5a2 2 0 0 0-2 2v-16Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 18.5H20M8 6h8M8 9.5h8M8 13h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function apply(ctx: Context): void {
  installStyles()
  bindTheme(ctx)

  const slots = (ctx as unknown as { slots?: SlotRegistry }).slots
  if (slots === undefined) return

  slots.inject('settings.section', () => slots.register({
    name: 'settings.section',
    id: 'novelview',
    order: 30,
    label: 'NovelView',
  }, NovelViewSettings))

  const inject = (ctx as unknown as {
    inject?: (
      dependencies: readonly string[],
      callback: (child: Context) => (() => void) | undefined,
    ) => unknown
  }).inject

  if (typeof inject !== 'function') return

  inject.call(ctx, ['layout'], child => {
    const childSlots = (child as unknown as { slots?: SlotRegistry }).slots
    const layout = (child as unknown as { layout?: LayoutService }).layout
    if (childSlots === undefined || layout === undefined) return undefined

    const stopMain = childSlots.inject('main', () => childSlots.register({
      name: 'main',
      key: MAIN_PANEL_ID,
    }, NovelViewPage))

    const stopSidebar = childSlots.inject('sidebar.panellist', () => childSlots.register({
      name: 'sidebar.panellist',
      id: MAIN_PANEL_ID,
      order: 45,
      label: 'NovelView',
    }, NovelViewIcon))

    const stopDetailAction = childSlots.inject('plugins.detail.actions', () => childSlots.register({
      name: 'plugins.detail.actions',
      id: 'novelview-open',
      order: 30,
      inject: () => ({
        packageName: 'dsh-novelview',
        onOpen: () => layout.selectPanel(MAIN_PANEL_ID),
      }),
    }, OpenNovelViewAction))

    return () => {
      stopDetailAction()
      stopSidebar()
      stopMain()
    }
  })
}

function OpenNovelViewAction({
  subject,
  packageName,
  onOpen,
}: {
  subject?: {
    kind?: string
    pkg?: { name?: string }
    row?: { moduleName?: string }
  }
  packageName: string
  onOpen: () => void
}): ReactNode {
  if (subject?.kind !== 'bundle' && subject?.kind !== 'row') return null
  if (subject.pkg?.name !== packageName) return null
  if (subject.kind === 'row' && subject.row?.moduleName !== packageName) return null

  return (
    <button type="button" className="nv-button primary" onClick={onOpen}>
      打开 NovelView
    </button>
  )
}
