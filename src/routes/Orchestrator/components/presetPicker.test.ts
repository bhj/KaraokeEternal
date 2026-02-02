import { describe, it, expect } from 'vitest'
import { buildPickerOptions, filterPickerOptions } from './presetPicker'
import { PRESETS } from './hydraPresets'

describe('buildPickerOptions', () => {
  const options = buildPickerOptions()

  it('returns one option per preset', () => {
    expect(options).toHaveLength(PRESETS.length)
  })

  it('each option has label, index, and code', () => {
    for (const opt of options) {
      expect(opt).toHaveProperty('label')
      expect(opt).toHaveProperty('index')
      expect(opt).toHaveProperty('code')
      expect(typeof opt.label).toBe('string')
      expect(typeof opt.index).toBe('number')
      expect(typeof opt.code).toBe('string')
      expect(opt.label.length).toBeGreaterThan(0)
      expect(opt.code.length).toBeGreaterThan(0)
    }
  })

  it('indices match position', () => {
    for (let i = 0; i < options.length; i++) {
      expect(options[i].index).toBe(i)
    }
  })
})

describe('filterPickerOptions', () => {
  const options = buildPickerOptions()

  it('returns all items on empty query', () => {
    expect(filterPickerOptions(options, '')).toHaveLength(options.length)
  })

  it('filters case-insensitively by label', () => {
    const result = filterPickerOptions(options, 'mari')
    expect(result.length).toBeGreaterThan(0)
    for (const opt of result) {
      expect(opt.label.toLowerCase()).toContain('mari')
    }
  })

  it('returns empty for non-matching query', () => {
    expect(filterPickerOptions(options, 'zzzznonexistent')).toHaveLength(0)
  })
})
