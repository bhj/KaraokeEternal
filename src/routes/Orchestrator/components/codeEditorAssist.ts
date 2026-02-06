import type { KeyBinding } from '@codemirror/view'

export interface AutocompleteOptions {
  defaultKeymap: boolean
}

export interface CompletionKeySpec {
  key: string
}

export const AUTOCOMPLETE_PASSIVE_HINTS = [
  'Tab accepts autocomplete suggestions.',
  'Ctrl+Space opens suggestions on demand.',
  'Ctrl+Enter sends the current sketch.',
  'Use /snippet at line start for quick inserts.',
]

export function getAutocompleteOptions (): AutocompleteOptions {
  return { defaultKeymap: false }
}

export function getCompletionAcceptKeySpecs (): CompletionKeySpec[] {
  return [{ key: 'Tab' }]
}

export function getCompletionAcceptKeyBindings (acceptRun: NonNullable<KeyBinding['run']>): KeyBinding[] {
  return [{ key: 'Tab', run: acceptRun }]
}
