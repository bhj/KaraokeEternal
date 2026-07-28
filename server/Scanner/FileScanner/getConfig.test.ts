import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import getConfig from './getConfig.js'
import { CONFIG_FILENAME } from './scanUtils.js'

describe('getConfig', () => {
  let baseDir: string

  const write = (dir: string, contents: string) => {
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, CONFIG_FILENAME), contents)
  }

  beforeEach(() => {
    baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ke-getconfig-'))
  })

  afterEach(() => {
    fs.rmSync(baseDir, { force: true, recursive: true })
  })

  it('returns undefined when no config exists', () => {
    expect(getConfig(baseDir, baseDir)).toBeUndefined()
  })

  it('parses a config in the folder itself', () => {
    write(baseDir, '{ artistOnLeft: false }')
    expect(getConfig(baseDir, baseDir)).toEqual({ artistOnLeft: false })
  })

  it('accepts JSON5 (comments and trailing commas)', () => {
    write(baseDir, '{\n  // a comment\n  artistOnLeft: false,\n}')
    expect(getConfig(baseDir, baseDir)).toEqual({ artistOnLeft: false })
  })

  it('walks up to baseDir when a folder has no config', () => {
    const leaf = path.join(baseDir, 'a', 'b')
    fs.mkdirSync(leaf, { recursive: true })
    write(baseDir, '{ delimiter: "_" }')

    expect(getConfig(leaf, baseDir)).toEqual({ delimiter: '_' })
  })

  it('prefers the nearest config', () => {
    const leaf = path.join(baseDir, 'a')
    write(baseDir, '{ delimiter: "_" }')
    write(leaf, '{ delimiter: "@" }')

    expect(getConfig(leaf, baseDir)).toEqual({ delimiter: '@' })
  })

  it('does not search above baseDir', () => {
    const mid = path.join(baseDir, 'a')
    const leaf = path.join(mid, 'b')
    fs.mkdirSync(leaf, { recursive: true })
    write(baseDir, '{ delimiter: "_" }')

    // baseDir has a config, but the search must stop at mid
    expect(getConfig(leaf, mid)).toBeUndefined()
  })

  it('throws on a malformed config rather than falling back to the default', () => {
    write(baseDir, '{ artistOnLeft: fals')
    expect(() => getConfig(baseDir, baseDir)).toThrow(CONFIG_FILENAME)
  })

  it('throws on a malformed config rather than falling back to a parent', () => {
    const leaf = path.join(baseDir, 'a')
    write(baseDir, '{ delimiter: "_" }')
    write(leaf, 'not json at all')

    expect(() => getConfig(leaf, baseDir)).toThrow(CONFIG_FILENAME)
  })

  it('throws when a config exists but cannot be read', () => {
    // a directory by that name is readable by getFiles but not by readFileSync
    fs.mkdirSync(path.join(baseDir, CONFIG_FILENAME))
    expect(() => getConfig(baseDir, baseDir)).toThrow(CONFIG_FILENAME)
  })
})
