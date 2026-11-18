import assert from 'node:assert/strict'
import test from 'node:test'
import { loadLibrary, splitChapters } from '../src/client/library.ts'

test('splits common Chinese chapter headings', () => {
  const chapters = splitChapters(
    '第一章 初见\n\n第一段。\n\n第二段。\n\n第二章 夜行\n\n下一段。',
    'txt',
  )

  assert.equal(chapters.length, 2)
  assert.equal(chapters[0]?.title, '第一章 初见')
  assert.deepEqual(chapters[0]?.paragraphs, ['第一段。', '第二段。'])
  assert.equal(chapters[1]?.title, '第二章 夜行')
})

test('splits Markdown headings', () => {
  const chapters = splitChapters(
    '# Opening\n\nA paragraph.\n\n## Second scene\n\nAnother paragraph.',
    'markdown',
  )

  assert.deepEqual(chapters.map(chapter => chapter.title), ['Opening', 'Second scene'])
})

test('keeps a book without headings readable', () => {
  const chapters = splitChapters('A short book without chapter headings.', 'txt')

  assert.equal(chapters.length, 1)
  assert.equal(chapters[0]?.title, '开篇')
  assert.deepEqual(chapters[0]?.paragraphs, ['A short book without chapter headings.'])
})

test('migrates the old default font size and width', () => {
  globalThis.localStorage = {
    getItem: () => JSON.stringify({
      books: [],
      settings: { fontSize: 17, readingWidth: 880 },
    }),
  } as Storage

  assert.deepEqual(loadLibrary().settings, { fontSize: 14, readingWidth: 748 })
})

test('preserves customized reader settings during migration', () => {
  globalThis.localStorage = {
    getItem: () => JSON.stringify({
      books: [],
      settings: { fontSize: 18, readingWidth: 960 },
    }),
  } as Storage

  assert.deepEqual(loadLibrary().settings, { fontSize: 18, readingWidth: 960 })
})

test('restores the exact default width after slider quantization', () => {
  globalThis.localStorage = {
    getItem: () => JSON.stringify({
      books: [],
      settings: { fontSize: 14, readingWidth: 740 },
      settingsVersion: 3,
    }),
  } as Storage

  assert.deepEqual(loadLibrary().settings, { fontSize: 14, readingWidth: 748 })
})
