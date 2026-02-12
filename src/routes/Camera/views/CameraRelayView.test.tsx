// @vitest-environment jsdom
import React, { act } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRoot } from 'react-dom/client'

const startMock = vi.fn()
const stopMock = vi.fn()

let mockStatus: 'idle' | 'connecting' | 'active' | 'error' = 'idle'
let mockStream: MediaStream | null = null

vi.mock('lib/webrtc/useCameraSender', () => ({
  useCameraSender: () => ({
    status: mockStatus,
    stream: mockStream,
    start: startMock,
    stop: stopMock,
  }),
}))

import CameraRelayView from './CameraRelayView'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('CameraRelayView', () => {
  beforeEach(() => {
    mockStatus = 'idle'
    mockStream = null
    startMock.mockReset()
    stopMock.mockReset()
    startMock.mockResolvedValue(undefined)
  })

  it('starts relay with environment-facing camera by default', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<CameraRelayView />)
    })

    const startButton = container.querySelector('button[data-role="camera-start-stop"]') as HTMLButtonElement | null
    expect(startButton).not.toBeNull()

    await act(async () => {
      startButton?.click()
    })

    expect(startMock).toHaveBeenCalledTimes(1)
    expect(startMock).toHaveBeenCalledWith({ facingMode: 'environment' })

    await act(async () => {
      root.unmount()
    })
  })

  it('stops relay when active', async () => {
    mockStatus = 'active'

    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<CameraRelayView />)
    })

    const stopButton = container.querySelector('button[data-role="camera-start-stop"]') as HTMLButtonElement | null
    expect(stopButton).not.toBeNull()

    await act(async () => {
      stopButton?.click()
    })

    expect(stopMock).toHaveBeenCalledTimes(1)
    expect(startMock).not.toHaveBeenCalled()

    await act(async () => {
      root.unmount()
    })
  })
})
