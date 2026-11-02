import { describe, it, expect } from 'vitest'
import validateProviderFields from './validateProviderFields.js'

describe('validateProviderFields', () => {
  it.each([
    ['an empty body', {}],
    ['connection fields', { name: 'P', url: 'http://p', apiKey: '' }],
    ['a name at the limit', { name: 'n'.repeat(1024) }],
    ['master enabled', { prefs: { enabled: false } }],
    ['song prefs', { prefs: { types: { song: { enabled: true, maxLibraryResults: 5 } } } }],
    ['song always', { prefs: { types: { song: { maxLibraryResults: null } } } }],
  ])('accepts %s', (_, fields) => {
    expect(validateProviderFields(fields)).toBeNull()
  })

  it.each([
    ['an unknown field', { type: 'song' }, 'Unsupported provider field: type'],
    ['an empty name', { name: '' }, 'Invalid name'],
    ['an oversized name', { name: 'n'.repeat(1025) }, 'Invalid name'],
    ['a non-string apiKey', { apiKey: 1 }, 'Invalid apiKey'],
    ['null prefs', { prefs: null }, 'Invalid prefs'],
    ['an unknown pref', { prefs: { maxLibraryResults: 1 } }, 'Unsupported provider pref: maxLibraryResults'],
    ['a non-boolean enabled', { prefs: { enabled: 'yes' } }, 'Invalid enabled'],
    ['null types', { prefs: { types: null } }, 'Invalid types'],
    ['an unsupported type', { prefs: { types: { background: { enabled: true } } } }, 'Unsupported provider type: background'],
    ['null type prefs', { prefs: { types: { song: null } } }, 'Invalid song prefs'],
    ['an unknown type pref', { prefs: { types: { song: { apiKey: 'k' } } } }, 'Unsupported song pref: apiKey'],
    ['a non-boolean type enabled', { prefs: { types: { song: { enabled: 1 } } } }, 'Invalid song enabled'],
    ['a negative maxLibraryResults', { prefs: { types: { song: { maxLibraryResults: -1 } } } }, 'Invalid maxLibraryResults'],
    ['a fractional maxLibraryResults', { prefs: { types: { song: { maxLibraryResults: 1.5 } } } }, 'Invalid maxLibraryResults'],
    ['an oversized maxLibraryResults', { prefs: { types: { song: { maxLibraryResults: 10001 } } } }, 'Invalid maxLibraryResults'],
  ])('rejects %s', (_, fields, message) => {
    expect(validateProviderFields(fields as Record<string, unknown>)).toBe(message)
  })
})
