import { describe, it, expect } from 'vitest'
import { AUTOCOMPLETE_PASSIVE_HINTS, getAutocompleteOptions, getCompletionAcceptKeySpecs } from './codeEditorAssist'

describe('codeEditorAssist', () => {
  it('disables default completion keymap so Enter does not accept suggestions', () => {
    expect(getAutocompleteOptions().defaultKeymap).toBe(false)
  })

  it('uses Tab as the only completion accept key', () => {
    const keys = getCompletionAcceptKeySpecs().map(spec => spec.key)
    expect(keys).toEqual(['Tab'])
    expect(keys).not.toContain('Enter')
  })

  it('provides passive hint copy for non-coder guidance', () => {
    expect(AUTOCOMPLETE_PASSIVE_HINTS).toContain('Tab accepts autocomplete suggestions.')
  })
})
