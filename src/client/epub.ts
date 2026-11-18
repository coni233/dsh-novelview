import type { Chapter } from './library.ts'

export interface ParsedEpub {
  title: string
  author?: string
  chapters: Chapter[]
}

interface ZipEntry {
  name: string
  method: number
  compressedSize: number
  localOffset: number
  encrypted: boolean
}

const DC_NAMESPACE = 'http://purl.org/dc/elements/1.1/'
const CONTENT_TYPES = new Set([
  'application/xhtml+xml',
  'text/html',
  'application/xml',
  'text/xml',
])
const MAX_EPUB_BYTES = 200 * 1024 * 1024

class EpubZip {
  private readonly data: Uint8Array
  private readonly entries = new Map<string, ZipEntry>()

  constructor(data: Uint8Array) {
    this.data = data
    if (data.byteLength > MAX_EPUB_BYTES) {
      throw new Error('EPUB 文件超过 200 MB，暂时无法导入。')
    }
    this.readDirectory()
  }

  async read(path: string): Promise<Uint8Array> {
    const normalized = normalizeZipPath(path)
    const entry = this.entries.get(normalized)
      ?? this.entries.get(normalized.toLowerCase())
    if (entry === undefined) throw new Error(`EPUB 中缺少文件：${path}`)
    if (entry.encrypted) throw new Error('此 EPUB 使用了加密内容，暂不支持导入。')

    const view = new DataView(this.data.buffer, this.data.byteOffset, this.data.byteLength)
    const localOffset = entry.localOffset
    if (readUint32(view, localOffset) !== 0x04034b50) {
      throw new Error('EPUB ZIP 文件头无效。')
    }
    const nameLength = readUint16(view, localOffset + 26)
    const extraLength = readUint16(view, localOffset + 28)
    const dataStart = localOffset + 30 + nameLength + extraLength
    const dataEnd = dataStart + entry.compressedSize
    if (dataEnd > this.data.byteLength) throw new Error('EPUB ZIP 数据被截断。')
    const compressed = this.data.subarray(dataStart, dataEnd)

    if (entry.method === 0) return compressed.slice()
    if (entry.method !== 8) {
      throw new Error(`暂不支持 EPUB 使用的 ZIP 压缩方式：${entry.method}`)
    }
    return inflateRaw(compressed)
  }

  private readDirectory(): void {
    const view = new DataView(this.data.buffer, this.data.byteOffset, this.data.byteLength)
    const eocd = findEndOfCentralDirectory(view)
    if (eocd < 0) throw new Error('无法识别 EPUB ZIP 目录。')
    const entryCount = readUint16(view, eocd + 10)
    let offset = readUint32(view, eocd + 16)

    for (let index = 0; index < entryCount; index += 1) {
      if (readUint32(view, offset) !== 0x02014b50) {
        throw new Error('EPUB ZIP 中央目录损坏。')
      }
      const flags = readUint16(view, offset + 8)
      const method = readUint16(view, offset + 10)
      const compressedSize = readUint32(view, offset + 20)
      const nameLength = readUint16(view, offset + 28)
      const extraLength = readUint16(view, offset + 30)
      const commentLength = readUint16(view, offset + 32)
      const localOffset = readUint32(view, offset + 42)
      const nameBytes = this.data.subarray(offset + 46, offset + 46 + nameLength)
      const name = normalizeZipPath(new TextDecoder().decode(nameBytes))

      this.entries.set(name, {
        name,
        method,
        compressedSize,
        localOffset,
        encrypted: (flags & 1) !== 0,
      })
      this.entries.set(name.toLowerCase(), this.entries.get(name) as ZipEntry)
      offset += 46 + nameLength + extraLength + commentLength
    }
  }
}

export async function parseEpub(
  fileName: string,
  input: ArrayBuffer,
): Promise<ParsedEpub> {
  const zip = new EpubZip(new Uint8Array(input))
  const containerDocument = parseXml(await readUtf8(zip, 'META-INF/container.xml'))
  const rootFile = firstElement(containerDocument, 'rootfile')
  const packagePath = normalizeZipPath(rootFile?.getAttribute('full-path') ?? '')
  if (packagePath.length === 0) throw new Error('EPUB 未声明内容清单文件。')

  const packageDocument = parseXml(await readUtf8(zip, packagePath))
  const metadata = firstElement(packageDocument, 'metadata')
  const title = elementText(metadata, 'title', DC_NAMESPACE)
    || fileName.replace(/\.epub$/i, '').trim()
    || '未命名电子书'
  const author = elementText(metadata, 'creator', DC_NAMESPACE) || undefined

  const manifest = new Map<string, { href: string; mediaType: string; properties: string }>()
  for (const item of elements(packageDocument, 'item')) {
    const id = item.getAttribute('id')
    const href = item.getAttribute('href')
    if (id === null || href === null) continue
    manifest.set(id, {
      href,
      mediaType: (item.getAttribute('media-type') ?? '').toLowerCase(),
      properties: item.getAttribute('properties') ?? '',
    })
  }

  const tocTitles = await readTocTitles(zip, packagePath, packageDocument, manifest)
  const spine = firstElement(packageDocument, 'spine')
  const chapterItems = elements(spine, 'itemref')
    .map(item => manifest.get(item.getAttribute('idref') ?? ''))
    .filter((item): item is { href: string; mediaType: string; properties: string } =>
      item !== undefined && CONTENT_TYPES.has(item.mediaType))

  const chapters: Chapter[] = []
  for (const item of chapterItems) {
    const path = resolveZipPath(packagePath, item.href)
    let source: string
    try {
      source = await readUtf8(zip, path)
    } catch {
      continue
    }
    const content = extractXhtml(source)
    if (content.paragraphs.length === 0) continue
    const tocTitle = tocTitles.get(path)
    chapters.push({
      id: `chapter-${chapters.length + 1}`,
      title: tocTitle || content.heading || `第 ${chapters.length + 1} 章`,
      paragraphs: content.paragraphs,
    })
  }

  if (chapters.length === 0) {
    throw new Error('此 EPUB 没有找到可阅读的正文内容。')
  }
  return { title, ...(author === undefined ? {} : { author }), chapters }
}

export function normalizeZipPath(value: string): string {
  const parts: string[] = []
  for (const part of value.replace(/\\/g, '/').split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') parts.pop()
    else parts.push(part)
  }
  return parts.join('/')
}

function resolveZipPath(baseFile: string, href: string): string {
  const cleanHref = safeDecode(href.split('#')[0] ?? '')
  const base = baseFile.split('/').slice(0, -1).join('/')
  return normalizeZipPath(`${base}/${cleanHref}`)
}

async function readTocTitles(
  zip: EpubZip,
  packagePath: string,
  packageDocument: Document,
  manifest: Map<string, { href: string; mediaType: string; properties: string }>,
): Promise<Map<string, string>> {
  const titles = new Map<string, string>()
  const nav = [...manifest.values()].find(item => item.properties.split(/\s+/).includes('nav'))
  if (nav !== undefined) {
    try {
      const navPath = resolveZipPath(packagePath, nav.href)
      const document = parseHtml(await readUtf8(zip, navPath))
      for (const link of [...document.querySelectorAll('nav a[href]')]) {
        const href = link.getAttribute('href')
        const title = normalizeText(link.textContent ?? '')
        if (href === null || title.length === 0) continue
        titles.set(resolveZipPath(navPath, href), title)
      }
      return titles
    } catch {
      // Fall back to the NCX table of contents.
    }
  }

  const ncxId = firstElement(packageDocument, 'spine')?.getAttribute('toc')
  const ncx = ncxId === null || ncxId === undefined ? undefined : manifest.get(ncxId)
  if (ncx === undefined) return titles
  try {
    const ncxPath = resolveZipPath(packagePath, ncx.href)
    const document = parseXml(await readUtf8(zip, ncxPath))
    for (const point of elements(document, 'navPoint')) {
      const content = firstElement(point, 'content')
      const label = firstElement(point, 'text')
      const src = content?.getAttribute('src')
      const title = normalizeText(label?.textContent ?? '')
      if (src === null || src === undefined || title.length === 0) continue
      titles.set(resolveZipPath(ncxPath, src), title)
    }
  } catch {
    // A broken TOC should not prevent the book from opening.
  }
  return titles
}

function extractXhtml(source: string): { heading?: string; paragraphs: string[] } {
  const document = parseHtml(source)
  for (const element of [...document.querySelectorAll('script, style, noscript, svg, audio, video')]) {
    element.remove()
  }
  const heading = normalizeText(
    document.querySelector('h1, h2, h3, h4, h5, h6')?.textContent ?? '',
  ) || undefined
  const body = document.body
  const candidates = [...body.querySelectorAll('p, li, blockquote, pre, dd, dt')]
  let paragraphs = candidates
    .filter(element => !element.querySelector('p, li, blockquote, pre, dd, dt'))
    .map(element => normalizeText(element.textContent ?? ''))
    .filter(Boolean)
  if (paragraphs.length === 0) {
    const fallback = normalizeText(body.textContent ?? '')
    paragraphs = fallback.length === 0 ? [] : [fallback]
  }
  if (heading !== undefined && paragraphs[0] === heading) paragraphs = paragraphs.slice(1)
  return { ...(heading === undefined ? {} : { heading }), paragraphs }
}

async function readUtf8(zip: EpubZip, path: string): Promise<string> {
  return new TextDecoder('utf-8').decode(await zip.read(path)).replace(/^\uFEFF/, '')
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const copy = new Uint8Array(data.byteLength)
  copy.set(data)
  const stream = new Blob([copy.buffer]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

function findEndOfCentralDirectory(view: DataView): number {
  const start = Math.max(0, view.byteLength - 65_557)
  for (let offset = view.byteLength - 22; offset >= start; offset -= 1) {
    if (readUint32(view, offset) === 0x06054b50) return offset
  }
  return -1
}

function readUint16(view: DataView, offset: number): number {
  return view.getUint16(offset, true)
}

function readUint32(view: DataView, offset: number): number {
  return view.getUint32(offset, true)
}

function parseXml(source: string): Document {
  const document = new DOMParser().parseFromString(source, 'application/xml')
  if (document.querySelector('parsererror') !== null) throw new Error('EPUB XML 内容无效。')
  return document
}

function parseHtml(source: string): Document {
  const document = new DOMParser().parseFromString(source, 'text/html')
  if (document.querySelector('parsererror') !== null) throw new Error('EPUB 章节内容无效。')
  return document
}

type XmlRoot = Document | Element

function elements(root: XmlRoot | null | undefined, tag: string): Element[] {
  return root === null || root === undefined
    ? []
    : [...root.getElementsByTagName(tag)]
}

function firstElement(root: XmlRoot | null | undefined, tag: string): Element | undefined {
  return elements(root, tag)[0]
}

function elementText(
  root: XmlRoot | null | undefined,
  tag: string,
  namespace: string,
): string {
  if (root === null || root === undefined) return ''
  const namespaced = root.getElementsByTagNameNS(namespace, tag)[0]
    ?? root.getElementsByTagName(tag)[0]
  return normalizeText(namespaced?.textContent ?? '')
}

function normalizeText(value: string): string {
  return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
