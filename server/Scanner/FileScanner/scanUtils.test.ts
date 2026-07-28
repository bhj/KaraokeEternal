import { describe, it, expect } from 'vitest'
import { fingerprintsEqual, getMtimeSec, getRelPath, isUnchanged, shouldKeepReplayGain } from './scanUtils.js'

describe('getRelPath', () => {
  it('strips the base path and leading slash', () => {
    expect(getRelPath('/media/karaoke', '/media/karaoke/foo/bar.mp3')).toBe('foo/bar.mp3')
  })

  it('normalizes backslashes to forward slashes', () => {
    expect(getRelPath('C:\\media', 'C:\\media\\foo\\bar.mp3')).toBe('foo/bar.mp3')
  })

  it('passes unicode filenames through', () => {
    expect(getRelPath('/media', '/media/日本語/curaçao.mp3')).toBe('日本語/curaçao.mp3')
  })

  it('matches the legacy inline normalization', () => {
    const legacy = (basePath: string, file: string) =>
      file.substring(basePath.length).replace(/\\/g, '/').replace(/^\//, '')

    const cases: [string, string][] = [
      ['/media/karaoke', '/media/karaoke/a - b.mp3'],
      ['C:\\kar', 'C:\\kar\\artist\\title.zip'],
      ['/m', '/m/x.mp3'],
    ]

    for (const [base, file] of cases) {
      expect(getRelPath(base, file)).toBe(legacy(base, file))
    }
  })
})

describe('getMtimeSec', () => {
  it('floors to whole seconds', () => {
    expect(getMtimeSec(1718000000999.9)).toBe(1718000000)
    expect(getMtimeSec(1718000000000)).toBe(1718000000)
    expect(getMtimeSec(1718000000001)).toBe(1718000000)
  })
})

describe('isUnchanged', () => {
  const row = { dateUpdated: 1718000000 }
  const mtimeSec = 1718000000
  const opts = {
    full: false,
    requiresCDG: false,
    cdgExists: () => {
      throw new Error('cdgExists should not be called')
    },
  }

  it('is false without a db row', () => {
    expect(isUnchanged(undefined, mtimeSec, opts)).toBe(false)
  })

  it('is false on a full rescan', () => {
    expect(isUnchanged(row, mtimeSec, { ...opts, full: true })).toBe(false)
  })

  it('is false when mtime differs', () => {
    expect(isUnchanged(row, mtimeSec + 1, opts)).toBe(false)
    expect(isUnchanged(row, mtimeSec - 1, opts)).toBe(false)
  })

  it('is false when a required cdg sidecar is missing', () => {
    expect(isUnchanged(row, mtimeSec, { ...opts, requiresCDG: true, cdgExists: () => false })).toBe(false)
  })

  it('is true when mtime matches and the required sidecar exists', () => {
    expect(isUnchanged(row, mtimeSec, { ...opts, requiresCDG: true, cdgExists: () => true })).toBe(true)
  })

  it('is true when mtime matches and no sidecar is required', () => {
    // opts.cdgExists throws, proving it is not consulted
    expect(isUnchanged(row, mtimeSec, opts)).toBe(true)
  })
})

describe('shouldKeepReplayGain', () => {
  const mtimeSec = 1718000000
  const stored = -6.5

  it('keeps values when the file is untouched since they were recorded', () => {
    expect(shouldKeepReplayGain(null, stored, mtimeSec, mtimeSec)).toBe(true)
  })

  it('keeps values when the row has no recorded mtime', () => {
    // rows added before dateUpdated held the mtime default to 0; without this
    // the first scan after upgrading wipes every client-calculated value
    expect(shouldKeepReplayGain(null, stored, mtimeSec, 0)).toBe(true)
  })

  it('keeps values when the recorded mtime is ahead of the file', () => {
    expect(shouldKeepReplayGain(null, stored, mtimeSec, mtimeSec + 1)).toBe(true)
  })

  it('discards values once the file has been modified', () => {
    expect(shouldKeepReplayGain(null, stored, mtimeSec + 1, mtimeSec)).toBe(false)
  })

  it('discards values when the file now carries its own tags', () => {
    expect(shouldKeepReplayGain(-8, stored, mtimeSec, mtimeSec)).toBe(false)
  })

  it('is false when there is nothing stored to keep', () => {
    expect(shouldKeepReplayGain(null, null, mtimeSec, mtimeSec)).toBe(false)
  })

  it('keeps a stored gain of 0 dB rather than treating it as absent', () => {
    expect(shouldKeepReplayGain(null, 0, mtimeSec, mtimeSec)).toBe(true)
  })
})

describe('fingerprintsEqual', () => {
  it('is true for equal maps regardless of key order', () => {
    expect(fingerprintsEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true)
  })

  it('is true for two empty maps', () => {
    expect(fingerprintsEqual({}, {})).toBe(true)
  })

  it('is false when a config was added', () => {
    expect(fingerprintsEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
  })

  it('is false when a config was removed', () => {
    expect(fingerprintsEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false)
  })

  it('is false when a config mtime changed', () => {
    expect(fingerprintsEqual({ a: 1 }, { a: 2 })).toBe(false)
  })
})
