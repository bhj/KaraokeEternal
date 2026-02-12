// @vitest-environment jsdom
import React, { act } from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createRoot } from 'react-dom/client'

let mockState: {
  user: { roomId: number | null }
  rooms: { entities: Record<number, { prefs?: Record<string, unknown> }> }
}

const apiMocks = vi.hoisted(() => ({
  fetchFolders: vi.fn(),
  fetchAllPresets: vi.fn(),
}))

vi.mock('store/hooks', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) => selector(mockState),
}))

vi.mock('routes/Orchestrator/api/hydraPresetsApi', () => ({
  fetchFolders: apiMocks.fetchFolders,
  fetchAllPresets: apiMocks.fetchAllPresets,
}))

import { useRuntimeHydraPresets } from './useRuntimeHydraPresets'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function HookHarness (): null {
  useRuntimeHydraPresets()
  return null
}

describe('useRuntimeHydraPresets', () => {
  beforeEach(() => {
    mockState = {
      user: { roomId: 1 },
      rooms: {
        entities: {
          1: {
            prefs: {
              playerPresetFolderId: 1,
            },
          },
        },
      },
    }

    apiMocks.fetchFolders.mockReset()
    apiMocks.fetchAllPresets.mockReset()

    apiMocks.fetchFolders.mockResolvedValue([
      { folderId: 1, name: 'Working', authorUserId: 1, authorName: 'owner', sortOrder: 1 },
      { folderId: 2, name: 'Alt', authorUserId: 1, authorName: 'owner', sortOrder: 2 },
    ])
    apiMocks.fetchAllPresets.mockResolvedValue([
      { presetId: 1, folderId: 1, name: 'a', code: 'osc(10).out()', authorUserId: 1, authorName: 'owner', sortOrder: 1 },
    ])
  })

  it('re-fetches presets when configured player preset folder changes', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<HookHarness />)
      await Promise.resolve()
    })

    expect(apiMocks.fetchFolders).toHaveBeenCalledTimes(1)
    expect(apiMocks.fetchAllPresets).toHaveBeenCalledTimes(1)

    mockState = {
      ...mockState,
      rooms: {
        entities: {
          1: {
            prefs: {
              playerPresetFolderId: 2,
            },
          },
        },
      },
    }

    await act(async () => {
      root.render(<HookHarness />)
      await Promise.resolve()
    })

    expect(apiMocks.fetchFolders).toHaveBeenCalledTimes(2)
    expect(apiMocks.fetchAllPresets).toHaveBeenCalledTimes(2)

    await act(async () => {
      root.unmount()
    })
  })
})
