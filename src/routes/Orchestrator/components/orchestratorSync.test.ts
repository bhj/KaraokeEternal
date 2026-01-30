import { describe, it, expect } from 'vitest'
import { shouldApplyRemoteCode } from './orchestratorSync'

describe('orchestratorSync', () => {
  it('ignores empty remote code', () => {
    expect(shouldApplyRemoteCode('', null)).toBe(false)
    expect(shouldApplyRemoteCode('local', '')).toBe(false)
  })

  it('applies remote code when different', () => {
    expect(shouldApplyRemoteCode('local', 'remote')).toBe(true)
  })

  it('skips when codes match', () => {
    expect(shouldApplyRemoteCode('same', 'same')).toBe(false)
  })
})
