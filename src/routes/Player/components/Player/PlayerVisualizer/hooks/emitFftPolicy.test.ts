import { describe, it, expect } from 'vitest'
import { shouldEmitFft } from './emitFftPolicy'

describe('shouldEmitFft', () => {
  it('emits regardless of isPlaying state', () => {
    expect(shouldEmitFft(true)).toBe(true)
    expect(shouldEmitFft(false)).toBe(true)
  })
})
