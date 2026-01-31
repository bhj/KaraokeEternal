import { describe, it, expect } from 'vitest'
import { getEffectiveCode, getPendingRemote, shouldAutoApplyPreset } from './orchestratorViewHelpers'
import { getPresetByIndex } from '../components/hydraPresets'

describe('orchestratorViewHelpers', () => {
  describe('getEffectiveCode', () => {
    it('returns remote code when user has not edited', () => {
      const result = getEffectiveCode('local', 'remote', false)
      expect(result).toBe('remote')
    })

    it('returns local code when user has edited', () => {
      const result = getEffectiveCode('local', 'remote', true)
      expect(result).toBe('local')
    })

    it('returns local code when remote is null and user has not edited', () => {
      const result = getEffectiveCode('local', null, false)
      expect(result).toBe('local')
    })

    it('returns local code when remote is empty and user has not edited', () => {
      const result = getEffectiveCode('local', '', false)
      expect(result).toBe('local')
    })

    it('returns remote code when remote is valid and user has not edited', () => {
      const result = getEffectiveCode('default', 'osc(10).out()', false)
      expect(result).toBe('osc(10).out()')
    })
  })

  describe('getPendingRemote', () => {
    it('returns null when user has not edited', () => {
      const result = getPendingRemote('remote', 'local', false)
      expect(result).toBeNull()
    })

    it('returns remote when user has edited and remote differs from local', () => {
      const result = getPendingRemote('remote', 'local', true)
      expect(result).toBe('remote')
    })

    it('returns null when remote matches local', () => {
      const result = getPendingRemote('same', 'same', true)
      expect(result).toBeNull()
    })

    it('returns null when remote is null', () => {
      const result = getPendingRemote(null, 'local', true)
      expect(result).toBeNull()
    })

    it('returns null when remote is empty', () => {
      const result = getPendingRemote('', 'local', true)
      expect(result).toBeNull()
    })

    it('returns null when remote is undefined', () => {
      const result = getPendingRemote(undefined, 'local', true)
      expect(result).toBeNull()
    })
  })

  /**
   * Banner count + pending remote replacement logic.
   *
   * The component state manages `pendingRemoteCode` and `pendingRemoteCount`.
   * Each new remote update replaces `pendingRemoteCode` with the latest and
   * increments `pendingRemoteCount`. This test validates the state transitions
   * that the OrchestratorView useEffect should implement.
   */
  describe('banner count increments and pending remote replaced', () => {
    /**
     * Simulate the state machine the component will use:
     * - pendingRemoteCode: string | null
     * - pendingRemoteCount: number
     * - On each remote update: if getPendingRemote returns non-null,
     *   replace pendingRemoteCode and increment pendingRemoteCount
     */
    function applyRemoteUpdate (
      remoteCode: string | null | undefined,
      localCode: string,
      userHasEdited: boolean,
      prevPending: string | null,
      prevCount: number,
    ): { pendingRemoteCode: string | null, pendingRemoteCount: number } {
      const pending = getPendingRemote(remoteCode, localCode, userHasEdited)
      if (pending !== null) {
        return {
          pendingRemoteCode: pending,
          pendingRemoteCount: prevCount + 1,
        }
      }
      // No new pending — keep existing state
      return { pendingRemoteCode: prevPending, pendingRemoteCount: prevCount }
    }

    it('first remote update sets pending and count = 1', () => {
      const result = applyRemoteUpdate('remote-v1', 'local', true, null, 0)
      expect(result.pendingRemoteCode).toBe('remote-v1')
      expect(result.pendingRemoteCount).toBe(1)
    })

    it('second remote update replaces pending and increments count to 2', () => {
      const result = applyRemoteUpdate('remote-v2', 'local', true, 'remote-v1', 1)
      expect(result.pendingRemoteCode).toBe('remote-v2')
      expect(result.pendingRemoteCount).toBe(2)
    })

    it('third remote update replaces pending and increments count to 3', () => {
      const result = applyRemoteUpdate('remote-v3', 'local', true, 'remote-v2', 2)
      expect(result.pendingRemoteCode).toBe('remote-v3')
      expect(result.pendingRemoteCount).toBe(3)
    })

    it('remote update matching local does not increment count', () => {
      const result = applyRemoteUpdate('local', 'local', true, 'remote-v2', 2)
      expect(result.pendingRemoteCode).toBe('remote-v2')
      expect(result.pendingRemoteCount).toBe(2)
    })

    it('remote update when not edited does not create pending', () => {
      const result = applyRemoteUpdate('remote-v1', 'local', false, null, 0)
      expect(result.pendingRemoteCode).toBeNull()
      expect(result.pendingRemoteCount).toBe(0)
    })

    it('apply clears pending (simulated by resetting state)', () => {
      // After user clicks Apply, component resets pending state
      const afterApply = { pendingRemoteCode: null, pendingRemoteCount: 0 }
      // Then a new remote arrives
      const result = applyRemoteUpdate('remote-v4', 'new-local', true, afterApply.pendingRemoteCode, afterApply.pendingRemoteCount)
      expect(result.pendingRemoteCode).toBe('remote-v4')
      expect(result.pendingRemoteCount).toBe(1)
    })
  })

  describe('shouldAutoApplyPreset', () => {
    it('returns true: index changed, userHasEdited, code matches gallery', () => {
      const code = getPresetByIndex(5)
      expect(shouldAutoApplyPreset(0, 5, true, code)).toBe(true)
    })

    it('returns false: index unchanged (5→5)', () => {
      const code = getPresetByIndex(5)
      expect(shouldAutoApplyPreset(5, 5, true, code)).toBe(false)
    })

    it('returns false: userHasEdited=false', () => {
      const code = getPresetByIndex(5)
      expect(shouldAutoApplyPreset(0, 5, false, code)).toBe(false)
    })

    it('returns false: prevIndex undefined (initial render)', () => {
      const code = getPresetByIndex(5)
      expect(shouldAutoApplyPreset(undefined, 5, true, code)).toBe(false)
    })

    it('returns false: code does not match gallery (spoofed)', () => {
      expect(shouldAutoApplyPreset(0, 5, true, 'malicious code')).toBe(false)
    })

    it('returns false: index out of bounds', () => {
      expect(shouldAutoApplyPreset(0, 9999, true, 'osc().out()')).toBe(false)
    })

    it('returns false: currentIndex undefined', () => {
      expect(shouldAutoApplyPreset(0, undefined, true, 'osc().out()')).toBe(false)
    })

    it('returns false: remoteCode is null', () => {
      expect(shouldAutoApplyPreset(0, 5, true, null)).toBe(false)
    })

    it('returns false: remoteCode is undefined', () => {
      expect(shouldAutoApplyPreset(0, 5, true, undefined)).toBe(false)
    })
  })
})
