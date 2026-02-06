// @vitest-environment jsdom
import React, { act } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import PresetTree from './PresetTree'
import type { PresetTreeNode } from './presetTree'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('PresetTree', () => {
  it('renders preset action controls with explicit aria labels for compact icon UI', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    const nodes: PresetTreeNode[] = [
      {
        id: 'folder:1',
        folderId: 1,
        name: 'My Presets',
        isGallery: false,
        children: [
          {
            id: 'preset:1',
            presetId: 1,
            folderId: 1,
            name: 'long_preset_name_that_needs_room',
            code: 'osc(10).out()',
            isGallery: false,
            usesCamera: false,
          },
        ],
      },
    ]

    await act(async () => {
      root.render(
        <PresetTree
          nodes={nodes}
          expanded={new Set(['folder:1'])}
          selectedPresetId={1}
          onToggleFolder={() => {}}
          onLoad={() => {}}
          onSend={() => {}}
          onDeletePreset={() => {}}
        />,
      )
    })

    expect(container.querySelector('button[aria-label="Load preset"]')).not.toBeNull()
    expect(container.querySelector('button[aria-label="Send preset"]')).not.toBeNull()
    expect(container.querySelector('button[aria-label="Delete preset"]')).not.toBeNull()

    await act(async () => {
      root.unmount()
    })
  })

  it('loads a preset when Enter is pressed on a preset row', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    const onLoad = vi.fn()

    const nodes: PresetTreeNode[] = [
      {
        id: 'folder:1',
        folderId: 1,
        name: 'My Presets',
        isGallery: false,
        children: [
          {
            id: 'preset:1',
            presetId: 1,
            folderId: 1,
            name: 'test',
            code: 'osc(10).out()',
            isGallery: false,
            usesCamera: false,
          },
        ],
      },
    ]

    await act(async () => {
      root.render(
        <PresetTree
          nodes={nodes}
          expanded={new Set(['folder:1'])}
          selectedPresetId={null}
          onToggleFolder={() => {}}
          onLoad={onLoad}
          onSend={() => {}}
        />,
      )
    })

    const focusables = Array.from(container.querySelectorAll<HTMLElement>('[data-tree-focusable="true"]'))
    const row = focusables[1] ?? null
    expect(row).not.toBeNull()

    await act(async () => {
      row?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })

    expect(onLoad).toHaveBeenCalledTimes(1)

    await act(async () => {
      root.unmount()
    })
  })
})
