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

interface CompletionNavigationRuns {
  startRun: NonNullable<KeyBinding['run']>
  closeRun: NonNullable<KeyBinding['run']>
  moveDownRun: NonNullable<KeyBinding['run']>
  moveUpRun: NonNullable<KeyBinding['run']>
  pageDownRun: NonNullable<KeyBinding['run']>
  pageUpRun: NonNullable<KeyBinding['run']>
}

export function getCompletionNavigationKeyBindings ({
  startRun,
  closeRun,
  moveDownRun,
  moveUpRun,
  pageDownRun,
  pageUpRun,
}: CompletionNavigationRuns): KeyBinding[] {
  return [
    { key: 'Ctrl-Space', run: startRun },
    { mac: 'Alt-`', run: startRun },
    { mac: 'Alt-i', run: startRun },
    { key: 'Escape', run: closeRun },
    { key: 'ArrowDown', run: moveDownRun },
    { key: 'ArrowUp', run: moveUpRun },
    { key: 'PageDown', run: pageDownRun },
    { key: 'PageUp', run: pageUpRun },
  ]
}
