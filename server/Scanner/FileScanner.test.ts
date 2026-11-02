import { describe, it, expect, vi } from 'vitest'

// FileScanner's module graph touches the database and IPC at import time
vi.mock('../lib/Database.js', () => ({ db: {} }))
vi.mock('../Media/Media.js', () => ({ default: { search: vi.fn() } }))
vi.mock('../lib/IPCBridge.js', () => ({ default: { req: vi.fn(), send: vi.fn() } }))

const { default: FileScanner } = await import('./FileScanner.js')
type ParserFn = import('./FileScanner.js').ParserFn

describe('FileScanner.process', () => {
  const scanner = new FileScanner({ paths: { result: [1], entities: { 1: { pathId: 1, path: '/srv/library', priority: 0, prefs: {} } } } })
  const parser: ParserFn = () => ({ title: 'T', artist: 'A' } as ReturnType<ParserFn>)

  it.each([
    ['/srv/library/song.txt', '.txt'],
    ['/srv/library/song', '(no extension)'],
  ])('rejects %s before touching the filesystem', async (file, ext) => {
    await expect(scanner.process(file, 1, parser)).rejects.toThrow(`unsupported file type: ${ext}`)
  })
})
