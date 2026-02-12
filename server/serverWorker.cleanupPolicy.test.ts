import { describe, expect, it } from 'vitest'
import { shouldRunGuestCleanup } from './serverWorker.js'

describe('serverWorker guest cleanup policy', () => {
  it('defaults to disabled when env flag is unset', () => {
    expect(shouldRunGuestCleanup({} as NodeJS.ProcessEnv)).toBe(false)
  })

  it('enables cleanup only when KES_ENABLE_APP_GUEST_CLEANUP=true', () => {
    expect(shouldRunGuestCleanup({ KES_ENABLE_APP_GUEST_CLEANUP: 'true' } as NodeJS.ProcessEnv)).toBe(true)
    expect(shouldRunGuestCleanup({ KES_ENABLE_APP_GUEST_CLEANUP: 'false' } as NodeJS.ProcessEnv)).toBe(false)
    expect(shouldRunGuestCleanup({ KES_ENABLE_APP_GUEST_CLEANUP: '1' } as NodeJS.ProcessEnv)).toBe(false)
  })
})
