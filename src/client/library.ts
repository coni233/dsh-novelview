import { parseEpub } from './epub.ts'

export type BookFormat = 'txt' | 'markdown' | 'epub'

export interface Chapter {
  id: string
  title: string
  paragraphs: string[]
}

export interface Book {
  id: string
  title: string
  author?: string
  format: BookFormat
  importedAt: string
  chapters: Chapter[]
}

export interface ReaderSettings {
  fontSize: number
  readingWidth: number
}

export interface ReadingProgress {
  bookId: string
  chapterIndex: number
}

export interface LibraryState {
  books: Book[]
  progress?: ReadingProgress
  settings: ReaderSettings
  settingsVersion?: number
}

const LIBRARY_KEY = 'novelview:library:v1'
const CHANGE_EVENT = 'novelview:library-change'
const SETTINGS_VERSION = 4

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 14,
  readingWidth: 748,
}

const EMPTY_STATE: LibraryState = {
  books: [],
  settings: DEFAULT_SETTINGS,
}

export function loadLibrary(): LibraryState {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY)
    if (raw === null) return { ...EMPTY_STATE, books: [] }
    const parsed = JSON.parse(raw) as Partial<LibraryState>
    const legacyFontSize = parsed.settingsVersion === undefined
      && parsed.settings?.fontSize === 17
    const storedSettingsVersion = parsed.settingsVersion ?? 0
    const legacyReadingWidth = (storedSettingsVersion < SETTINGS_VERSION)
      && (parsed.settings?.readingWidth === 880 || parsed.settings?.readingWidth === 740)
    const fontSize = legacyFontSize
      ? DEFAULT_SETTINGS.fontSize
      : parsed.settings?.fontSize ?? DEFAULT_SETTINGS.fontSize
    const readingWidth = legacyReadingWidth
      ? DEFAULT_SETTINGS.readingWidth
      : parsed.settings?.readingWidth ?? DEFAULT_SETTINGS.readingWidth

    return {
      books: Array.isArray(parsed.books) ? parsed.books : [],
      ...(isProgress(parsed.progress) ? { progress: parsed.progress } : {}),
      settings: {
        fontSize: clamp(fontSize, 10, 22),
        readingWidth: clamp(readingWidth, 680, 1200),
      },
      settingsVersion: SETTINGS_VERSION,
    }
  } catch {
    return { ...EMPTY_STATE, books: [] }
  }
}

export function saveLibrary(state: LibraryState): void {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(state))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

export function subscribeLibrary(listener: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}

export function importBook(name: string, text: string): Book {
  const format: BookFormat = /\.(?:md|markdown)$/i.test(name) ? 'markdown' : 'txt'
  const title = name.replace(/\.[^.]+$/, '').trim() || '未命名电子书'
  const normalized = text.replace(/\r\n?/g, '\n').trim()
  if (normalized.length === 0) throw new Error('电子书内容为空。')

  const chapters = splitChapters(normalized, format)
  return {
    id: createId(),
    title,
    format,
    importedAt: new Date().toISOString(),
    chapters,
  }
}

export async function importFile(name: string, file: File): Promise<Book> {
  if (/\.epub$/i.test(name) || file.type === 'application/epub+zip') {
    const parsed = await parseEpub(name, await file.arrayBuffer())
    return {
      id: createId(),
      title: parsed.title,
      ...(parsed.author === undefined ? {} : { author: parsed.author }),
      format: 'epub',
      importedAt: new Date().toISOString(),
      chapters: parsed.chapters,
    }
  }
  return importBook(name, await file.text())
}

export function supportedBookFile(name: string, type = ''): boolean {
  return /\.(?:txt|md|markdown|epub)$/i.test(name)
    || type === 'text/plain'
    || type === 'text/markdown'
    || type === 'application/epub+zip'
}

export function splitChapters(text: string, format: BookFormat): Chapter[] {
  const lines = text.split('\n')
  const sections: Array<{ title: string; lines: string[] }> = []
  let current = { title: '开篇', lines: [] as string[] }

  for (const line of lines) {
    const title = chapterTitle(line, format)
    if (title !== null) {
      if (hasContent(current.lines)) sections.push(current)
      current = { title, lines: [] }
    } else {
      current.lines.push(line)
    }
  }
  if (hasContent(current.lines)) sections.push(current)

  const sourceSections = sections.length > 0
    ? sections
    : chunkLongText(text).map((part, index) => ({
        title: `第 ${index + 1} 部分`,
        lines: part.split('\n'),
      }))

  return sourceSections.map((section, index) => ({
    id: `chapter-${index + 1}`,
    title: section.title,
    paragraphs: splitParagraphs(section.lines.join('\n')),
  }))
}

function chapterTitle(line: string, format: BookFormat): string | null {
  const trimmed = line.trim()
  if (trimmed.length === 0 || trimmed.length > 80) return null

  if (format === 'markdown') {
    const heading = /^#{1,3}\s+(.+)$/.exec(trimmed)
    if (heading !== null) return heading[1]?.trim() || null
  }

  if (/^第[0-9０-９一二三四五六七八九十百千万零〇两]+[章卷回节篇部集].*$/.test(trimmed)) {
    return trimmed
  }
  if (/^(?:chapter|part|book)\s+[0-9ivxlcdm]+(?:\s*[:.-]\s*.+)?$/i.test(trimmed)) {
    return trimmed
  }
  if (/^(?:序章|楔子|前言|后记|尾声|终章)$/.test(trimmed)) {
    return trimmed
  }
  return null
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .flatMap(part => {
      const trimmed = part.trim()
      if (trimmed.length <= 500) return trimmed.length > 0 ? [trimmed] : []
      return trimmed.match(/[\s\S]{1,420}(?:[。！？.!?]|$)/g)?.map(chunk => chunk.trim()).filter(Boolean) ?? []
    })
    .filter(Boolean)
}

function chunkLongText(text: string): string[] {
  const chunks: string[] = []
  for (let index = 0; index < text.length; index += 6000) {
    chunks.push(text.slice(index, index + 6000))
  }
  return chunks
}

function hasContent(lines: string[]): boolean {
  return lines.some(line => line.trim().length > 0)
}

function isProgress(value: unknown): value is ReadingProgress {
  if (typeof value !== 'object' || value === null) return false
  const progress = value as Partial<ReadingProgress>
  return typeof progress.bookId === 'string' && Number.isInteger(progress.chapterIndex)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
