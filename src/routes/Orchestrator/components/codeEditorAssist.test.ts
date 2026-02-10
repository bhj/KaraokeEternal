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

  it('uses Enter as the only completion accept key', () => {
    const keys = getCompletionAcceptKeySpecs().map(spec => spec.key)
    expect(keys).toEqual(['Enter'])
    expect(keys).not.toContain('Tab')
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
    expect(keys).toContain('Tab')
    expect(keys).toContain('Shift-Tab')
    expect(keys).not.toContain('Enter')
  })

  it('provides passive hint copy for non-coder guidance', () => {
    const joined = AUTOCOMPLETE_PASSIVE_HINTS.join(' ')
    expect(joined).toContain('Enter accepts')
    expect(joined).toContain('Tab navigates')
  })
})
