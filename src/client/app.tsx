import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import {
  importFile,
  loadLibrary,
  saveLibrary,
  subscribeLibrary,
  type Book,
  type LibraryState,
  supportedBookFile,
} from './library.ts'
import { useDarkTheme } from './theme.ts'

function useLibrary(): LibraryState {
  const [state, setState] = useState<LibraryState>(() => loadLibrary())

  useEffect(() => {
    const refresh = (): void => setState(loadLibrary())
    return subscribeLibrary(refresh)
  }, [])

  return state
}

function updateLibrary(update: (state: LibraryState) => LibraryState): void {
  saveLibrary(update(loadLibrary()))
}

export function NovelViewPage() {
  const library = useLibrary()
  const dark = useDarkTheme()
  const [error, setError] = useState<string>()
  const activeBook = library.books.find(book => book.id === library.progress?.bookId)
    ?? library.books[0]
  const rawChapterIndex = library.progress?.bookId === activeBook?.id
    ? library.progress?.chapterIndex ?? 0
    : 0
  const chapterIndex = Math.min(
    rawChapterIndex,
    Math.max(0, (activeBook?.chapters.length ?? 1) - 1),
  )
  const chapter = activeBook?.chapters[chapterIndex]
  const pageRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => {
    pageRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [activeBook?.id, chapterIndex])

  useEffect(() => {
    if (activeBook === undefined || library.progress?.bookId === activeBook.id) return
    updateLibrary(state => ({
      ...state,
      progress: { bookId: activeBook.id, chapterIndex: 0 },
    }))
  }, [activeBook, library.progress?.bookId])

  function selectBook(event: ChangeEvent<HTMLSelectElement>): void {
    const bookId = event.target.value
    if (bookId.length === 0) return
    updateLibrary(state => ({ ...state, progress: { bookId, chapterIndex: 0 } }))
  }

  function changeChapter(nextIndex: number): void {
    if (activeBook === undefined) return
    updateLibrary(state => ({
      ...state,
      progress: { bookId: activeBook.id, chapterIndex: nextIndex },
    }))
  }

  async function importFiles(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    setError(undefined)
    try {
      const imported: Book[] = []
      for (const file of files) {
        if (!supportedBookFile(file.name, file.type)) {
          throw new Error(`不支持的电子书格式：${file.name}`)
        }
        imported.push(await importFile(file.name, file))
      }
      updateLibrary(state => ({
        ...state,
        books: [...state.books, ...imported],
        progress: imported[0] === undefined
          ? state.progress
          : { bookId: imported[0].id, chapterIndex: 0 },
      }))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '无法导入这本书。')
    }
  }

  function updateSetting(key: 'fontSize' | 'readingWidth', value: number): void {
    updateLibrary(state => ({
      ...state,
      settings: { ...state.settings, [key]: value },
    }))
  }

  return (
    <div ref={pageRef} className={`nv-page ${dark ? 'nv-dark' : 'nv-light'}`}>
      <div className="nv-shell">
        <header className="nv-header">
          <div className="nv-title-group">
            <span className="nv-brand">NovelView</span>
            <span className="nv-mode">阅读模式</span>
          </div>
          <div className="nv-toolbar">
            {library.books.length > 0 && activeBook !== undefined && (
              <>
                <select
                  className="nv-select"
                  aria-label="选择书籍"
                  value={activeBook.id}
                  onChange={selectBook}
                >
                  {library.books.map(book => (
                    <option key={book.id} value={book.id}>{book.title}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="nv-button"
                  onClick={() => updateSetting('fontSize', Math.max(10, library.settings.fontSize - 1))}
                  aria-label="缩小字号"
                >
                  A-
                </button>
                <button
                  type="button"
                  className="nv-button"
                  onClick={() => updateSetting('fontSize', Math.min(22, library.settings.fontSize + 1))}
                  aria-label="放大字号"
                >
                  A+
                </button>
              </>
            )}
            <button
              type="button"
              className="nv-button primary"
              onClick={() => fileRef.current?.click()}
            >
              导入
            </button>
            <input
              ref={fileRef}
              className="nv-hidden"
              type="file"
              accept=".txt,.md,.markdown,.epub,text/plain,text/markdown,application/epub+zip"
              multiple
              onChange={event => { void importFiles(event) }}
            />
          </div>
        </header>

        {error !== undefined && <p className="nv-error">{error}</p>}

        {library.books.length === 0 ? (
          <EmptyState onImport={() => fileRef.current?.click()} />
        ) : chapter !== undefined && activeBook !== undefined ? (
          <main
            className="nv-reader"
            style={{
              '--nv-reading-width': `${library.settings.readingWidth}px`,
              '--nv-font-size': `${library.settings.fontSize}px`,
            } as React.CSSProperties}
          >
            <section className="nv-turn" aria-label={`第 ${chapterIndex + 1} 章`}>
              <div className="nv-user-row">
                <div className="nv-user-bubble">
                  {chapterIndex === 0
                    ? `打开《${activeBook.title}》，从「${chapter.title}」开始阅读。`
                    : `继续阅读「${chapter.title}」。`}
                </div>
              </div>
              <div className="nv-response-status">
                <span>已完成</span>
                <span className="nv-status-dot">·</span>
                <span>第 {chapterIndex + 1} / {activeBook.chapters.length} 章</span>
                <span className="nv-status-chevron" aria-hidden="true">⌄</span>
              </div>
              <div className="nv-response-divider" />
              <article className="nv-assistant-response">
                <h2 className="nv-chapter-title">{chapter.title}</h2>
                <ReadingStream paragraphs={chapter.paragraphs} />
              </article>
            </section>

            <div className="nv-composer-dock">
              <div className="nv-composer" role="navigation" aria-label="章节导航">
                <button
                  type="button"
                  className="nv-composer-button"
                  disabled={chapterIndex === 0}
                  onClick={() => changeChapter(chapterIndex - 1)}
                >
                  <span aria-hidden="true">‹</span>
                  上一章
                </button>
                <div className="nv-composer-context">
                  <strong title={activeBook.title}>{activeBook.title}</strong>
                  <label className="nv-chapter-jump">
                    <span className="nv-chapter-jump-label">跳转到</span>
                    <select
                      className="nv-chapter-select"
                      aria-label="跳转到章节"
                      value={chapterIndex}
                      onChange={event => changeChapter(Number(event.target.value))}
                    >
                      {activeBook.chapters.map((candidate, index) => (
                        <option key={candidate.id} value={index}>
                          {index + 1}. {candidate.title}
                        </option>
                      ))}
                    </select>
                    <span>/ {activeBook.chapters.length}</span>
                  </label>
                </div>
                <button
                  type="button"
                  className="nv-composer-button"
                  disabled={chapterIndex >= activeBook.chapters.length - 1}
                  onClick={() => changeChapter(chapterIndex + 1)}
                >
                  下一章
                  <span aria-hidden="true">›</span>
                </button>
              </div>
            </div>
          </main>
        ) : (
          <p className="nv-error">这本书没有可阅读的文本。</p>
        )}
      </div>
    </div>
  )
}

function ReadingStream({ paragraphs }: { paragraphs: string[] }) {
  const blocks = useMemo(
    () => paragraphs.flatMap(paragraph => paragraph.split(/\n/).filter(Boolean)),
    [paragraphs],
  )

  return (
    <div className="nv-stream" role="article" aria-label="小说阅读内容">
      {blocks.map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 24)}`} className="nv-paragraph">
          {paragraph}
        </p>
      ))}
    </div>
  )
}

function EmptyState({ onImport }: { onImport: () => void }) {
  return (
    <section className="nv-empty">
      <h2>你的安静阅读空间</h2>
      <p>
        导入本地 TXT 或 Markdown 电子书。NovelView 会把内容保存在当前设备，
        并以对话形式呈现每个章节。
      </p>
      <button type="button" className="nv-button primary" onClick={onImport}>
        导入第一本电子书
      </button>
    </section>
  )
}

export function NovelViewSettings() {
  const library = useLibrary()
  const dark = useDarkTheme()
  const [error, setError] = useState<string>()
  const fileRef = useRef<HTMLInputElement>(null)

  async function importFiles(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    setError(undefined)
    try {
      const imported: Book[] = []
      for (const file of files) {
        if (!supportedBookFile(file.name, file.type)) {
          throw new Error(`不支持的电子书格式：${file.name}`)
        }
        imported.push(await importFile(file.name, file))
      }
      if (imported.length > 0) {
        updateLibrary(state => ({
          ...state,
          books: [...state.books, ...imported],
          progress: { bookId: imported[0]!.id, chapterIndex: 0 },
        }))
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '无法导入这本书。')
    }
  }

  function removeBook(book: Book): void {
    const accepted = window.confirm(`确定要从 NovelView 中移除《${book.title}》吗？`)
    if (!accepted) return
    updateLibrary(state => {
      const books = state.books.filter(candidate => candidate.id !== book.id)
      const progress = state.progress?.bookId === book.id
        ? books[0] === undefined ? undefined : { bookId: books[0].id, chapterIndex: 0 }
        : state.progress
      return { ...state, books, ...(progress === undefined ? { progress: undefined } : { progress }) }
    })
  }

  function updateSetting(key: 'fontSize' | 'readingWidth', value: number): void {
    updateLibrary(state => ({ ...state, settings: { ...state.settings, [key]: value } }))
  }

  return (
    <div className={`nv-settings ${dark ? 'nv-dark' : 'nv-light'}`}>
      <section className="nv-settings-card">
        <h3>小说书架</h3>
        <p>导入本地 TXT 或 Markdown 电子书，文件不会离开这台设备。</p>
        <button type="button" className="nv-button primary" onClick={() => fileRef.current?.click()}>
          导入电子书
        </button>
        <input
          ref={fileRef}
          className="nv-hidden"
          type="file"
          accept=".txt,.md,.markdown,.epub,text/plain,text/markdown,application/epub+zip"
          multiple
          onChange={event => { void importFiles(event) }}
        />
        {error !== undefined && <p className="nv-error">{error}</p>}
        <div className="nv-library-list">
          {library.books.length === 0 && <span className="nv-muted">暂无已导入的电子书。</span>}
          {library.books.map(book => (
            <div key={book.id} className="nv-library-item">
              <span>
                <strong>{book.title}</strong>
                <small>
                  {book.author === undefined ? '' : `${book.author} · `}
                  {book.chapters.length} 章 · {book.format.toUpperCase()}
                </small>
              </span>
              <div className="nv-library-actions">
                <button type="button" className="nv-button" onClick={() => removeBook(book)}>移除</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="nv-settings-card">
        <h3>阅读设置</h3>
        <p>调整 NovelView 的阅读排版，不影响 DeepSeek Harness 的其他界面。</p>
        <label className="nv-setting-row">
          <span className="nv-setting-label">字号</span>
          <span className="nv-setting-value">{library.settings.fontSize}px</span>
          <input
            type="range"
            min={10}
            max={22}
            value={library.settings.fontSize}
            onChange={event => updateSetting('fontSize', Number(event.target.value))}
          />
        </label>
        <label className="nv-setting-row">
          <span className="nv-setting-label">阅读宽度</span>
          <span className="nv-setting-value">{library.settings.readingWidth}px</span>
          <input
            type="range"
            min={680}
            max={1200}
            step={1}
            value={library.settings.readingWidth}
            onChange={event => updateSetting('readingWidth', Number(event.target.value))}
          />
        </label>
      </section>
    </div>
  )
}
