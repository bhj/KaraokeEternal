import { describe, it, expect, vi } from 'vitest'
import {
  AUTOCOMPLETE_PASSIVE_HINTS,
  getAutocompleteOptions,
  getCompletionAcceptKeySpecs,
  getCompletionNavigationKeyBindings,
} from './codeEditorAssist'

describe('codeEditorAssist', () => {
  it('disables default completion keymap so Enter does not accept suggestions', () => {
    expect(getAutocompleteOptions().defaultKeymap).toBe(false)
  })

  it('uses Tab as the only completion accept key', () => {
    const keys = getCompletionAcceptKeySpecs().map(spec => spec.key)
    expect(keys).toEqual(['Tab'])
    expect(keys).not.toContain('Enter')
  })

  it('provides completion navigation keys when default completion keymap is disabled', () => {
    const run = vi.fn(() => true)
    const keys = getCompletionNavigationKeyBindings({
      startRun: run,
      closeRun: run,
      moveDownRun: run,
      moveUpRun: run,
      pageDownRun: run,
      pageUpRun: run,
    }).map(spec => spec.key ?? spec.mac)

    expect(keys).toContain('ArrowDown')
    expect(keys).toContain('ArrowUp')
    expect(keys).toContain('PageDown')
    expect(keys).toContain('PageUp')
    expect(keys).toContain('Ctrl-Space')
    expect(keys).toContain('Escape')
    expect(keys).not.toContain('Enter')
  })

  it('provides passive hint copy for non-coder guidance', () => {
    expect(AUTOCOMPLETE_PASSIVE_HINTS).toContain('Tab accepts autocomplete suggestions.')
  })
})
