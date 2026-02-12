// @vitest-environment jsdom
import React, { act } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  navigate: vi.fn(),
  leaveRoom: vi.fn(() => ({ type: 'rooms/leave' })),
  requestLogout: vi.fn(() => ({ type: 'user/logout' })),
  removeItem: vi.fn(() => ({ type: 'queue/remove' })),
  upcomingQueueIds: [] as number[],
  statusVisualizer: {
    presetCategory: 'default',
    isEnabled: true,
    mode: 'hydra',
  } as Record<string, unknown>,
  playerVisualizer: undefined as Record<string, unknown> | undefined,
  roomPrefs: {
    allowGuestCameraRelay: true,
  } as Record<string, unknown>,
  user: {
    userId: 11,
    username: 'tester',
    isGuest: false,
    isAdmin: false,
    authProvider: 'local',
    roomId: 2,
    ownRoomId: 1,
  },
}))

vi.mock('store/hooks', () => ({
  useAppDispatch: () => mocks.dispatch,
  useAppSelector: (selector: (state: unknown) => unknown) => selector({
    user: mocks.user,
    status: { visualizer: mocks.statusVisualizer },
    playerVisualizer: mocks.playerVisualizer,
    rooms: {
      entities: typeof mocks.user.roomId === 'number'
        ? { [mocks.user.roomId]: { roomId: mocks.user.roomId, prefs: mocks.roomPrefs } }
        : {},
    },
  }),
}))

vi.mock('routes/Queue/selectors/getUpcoming', () => ({
  default: () => mocks.upcomingQueueIds,
}))

vi.mock('store/modules/user', () => ({
  requestLogout: mocks.requestLogout,
  updateAccount: vi.fn(() => ({ type: 'user/update' })),
}))

vi.mock('routes/Queue/modules/queue', () => ({
  removeItem: mocks.removeItem,
}))

vi.mock('store/modules/rooms', () => ({
  leaveRoom: mocks.leaveRoom,
}))

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  }
})

vi.mock('components/Panel/Panel', () => ({
  default: ({ children, title }: { children: React.ReactNode, title: string }) => (
    <section data-title={title}>{children}</section>
  ),
}))

vi.mock('components/Button/Button', () => ({
  default: ({ children, onClick, type = 'button' }: { children: React.ReactNode, onClick?: () => void, type?: 'button' | 'submit' }) => (
    <button type={type} onClick={onClick}>{children}</button>
  ),
}))

vi.mock('../AccountForm/AccountForm', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <form>{children}</form>
  ),
}))

import Account from './Account'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('Account', () => {
  beforeEach(() => {
    mocks.dispatch.mockReset()
    mocks.leaveRoom.mockClear()
    mocks.requestLogout.mockClear()
    mocks.removeItem.mockClear()
    mocks.navigate.mockReset()
    mocks.upcomingQueueIds = []
    mocks.statusVisualizer = {
      presetCategory: 'default',
      isEnabled: true,
      mode: 'hydra',
    }
    mocks.playerVisualizer = undefined
    mocks.roomPrefs = {
      allowGuestCameraRelay: true,
    }
    mocks.user = {
      userId: 11,
      username: 'tester',
      isGuest: false,
      isAdmin: false,
      authProvider: 'local',
      roomId: 2,
      ownRoomId: 1,
    }
    vi.stubGlobal('confirm', vi.fn(() => true))
  })

  it('renders Back to My Room only when visiting another room', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<Account />)
    })

    const leaveButton = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Back to My Room',
    )
    expect(leaveButton).toBeDefined()

    await act(async () => {
      root.unmount()
    })

    mocks.user = {
      ...mocks.user,
      roomId: 1,
      ownRoomId: 1,
    }

    const container2 = document.createElement('div')
    const root2 = createRoot(container2)

    await act(async () => {
      root2.render(<Account />)
    })

    const hiddenButton = Array.from(container2.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Back to My Room',
    )
    expect(hiddenButton).toBeUndefined()

    await act(async () => {
      root2.unmount()
    })
  })

  it('asks for confirmation before returning to own room', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<Account />)
    })

    const leaveButton = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Back to My Room',
    )
    expect(leaveButton).toBeDefined()

    await act(async () => {
      leaveButton?.click()
    })

    expect(globalThis.confirm).toHaveBeenCalledWith(expect.stringContaining('leave the current party'))
    expect(mocks.leaveRoom).toHaveBeenCalledTimes(1)
    expect(mocks.dispatch).toHaveBeenCalledWith({ type: 'rooms/leave' })

    await act(async () => {
      root.unmount()
    })
  })

  it('does not leave room when return confirmation is cancelled', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))

    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<Account />)
    })

    const leaveButton = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Back to My Room',
    )

    await act(async () => {
      leaveButton?.click()
    })

    expect(mocks.leaveRoom).not.toHaveBeenCalled()
    expect(mocks.dispatch).not.toHaveBeenCalledWith({ type: 'rooms/leave' })

    await act(async () => {
      root.unmount()
    })
  })

  it('shows Open Camera Relay when camera preset is active and navigates to /camera', async () => {
    mocks.statusVisualizer = {
      ...mocks.statusVisualizer,
      presetCategory: 'camera',
    }

    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<Account />)
    })

    const openButton = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Open Camera Relay',
    )
    expect(openButton).toBeDefined()

    await act(async () => {
      openButton?.click()
    })

    expect(mocks.navigate).toHaveBeenCalledWith('/camera')

    await act(async () => {
      root.unmount()
    })
  })

  it('shows Open Camera Relay for guest when camera relay is enabled', async () => {
    mocks.user = {
      ...mocks.user,
      isGuest: true,
      authProvider: 'guest',
      ownRoomId: null,
      roomId: 2,
    }
    mocks.statusVisualizer = {
      ...mocks.statusVisualizer,
      presetCategory: 'default',
      allowCamera: true,
    }
    mocks.playerVisualizer = undefined

    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<Account />)
    })

    const openButton = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Open Camera Relay',
    )
    expect(openButton).toBeDefined()

    await act(async () => {
      openButton?.click()
    })

    expect(mocks.navigate).toHaveBeenCalledWith('/camera')

    await act(async () => {
      root.unmount()
    })
  })
})
