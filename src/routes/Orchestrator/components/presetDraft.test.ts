import { describe, it, expect } from 'vitest'
import { buildPresetDraft } from './presetDraft'

describe('buildPresetDraft', () => {
  it('uses current code with empty name for manual save', () => {
    const draft = buildPresetDraft({ currentCode: 'osc(10).out()' })
    expect(draft.name).toBe('')
    expect(draft.code).toBe('osc(10).out()')
  })

  it('prefills clone name and code when cloning a preset', () => {
    const draft = buildPresetDraft({
      currentCode: 'ignored',
      preset: { name: 'flor_1', code: 'src(s0).out()' },
    })
    expect(draft.name).toBe('flor_1 copy')
    expect(draft.code).toBe('src(s0).out()')
  })

  it('increments trailing copy suffix when cloning an already-cloned preset', () => {
    const firstClone = buildPresetDraft({
      currentCode: 'ignored',
      preset: { name: 'flor_1 copy', code: 'src(s0).out()' },
    })

    const numberedClone = buildPresetDraft({
      currentCode: 'ignored',
      preset: { name: 'flor_1 copy 2', code: 'src(s0).out()' },
    })

    expect(firstClone.name).toBe('flor_1 copy 2')
    expect(numberedClone.name).toBe('flor_1 copy 3')
  })
})
