import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CAMERA_OFFER,
  CAMERA_OFFER_REQ,
  PLAYER_CMD_NEXT,
  PLAYER_REQ_NEXT,
  VISUALIZER_HYDRA_CODE,
  VISUALIZER_HYDRA_CODE_REQ,
} from '../../shared/actionTypes.js'

vi.mock('../Rooms/Rooms.js', () => ({
  default: {
    get: vi.fn(),
    prefix: vi.fn((roomId: number) => `ROOM_ID_${roomId}`),
  },
}))

vi.mock('../lib/Log.js', () => ({
  default: () => ({
    verbose: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  }),
}))

import Rooms from '../Rooms/Rooms.js'
import handlers, { canManageRoom } from './socket.js'

interface MockSocket {
  id: string
  user: {
    userId: number
    roomId: number
    isAdmin: boolean
  }
  to: ReturnType<typeof vi.fn>
  server: {
    to: ReturnType<typeof vi.fn>
  }
}

function createMockSocket (user: MockSocket['user']) {
  const othersEmit = vi.fn()
  const broadcastEmit = vi.fn()
  const serverTo = vi.fn(() => ({ emit: broadcastEmit }))
  const socketTo = vi.fn(() => ({ emit: othersEmit }))
  const sock = {
    id: 'sock-1',
    user,
    to: socketTo,
    server: { to: serverTo },
  }
  return { sock: sock as unknown as MockSocket, othersEmit, broadcastEmit, serverTo, socketTo }
}

describe('Player socket permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('canManageRoom allows admins without room owner lookup', async () => {
    const allowed = await canManageRoom({
      user: {
        userId: 10,
        roomId: 5,
        isAdmin: true,
      },
    } as unknown as MockSocket)

    expect(allowed).toBe(true)
    expect(Rooms.get).not.toHaveBeenCalled()
  })

  it('blocks hydra code broadcast when collaborator send is disabled', async () => {
    vi.mocked(Rooms.get).mockResolvedValue({
      result: [55],
      entities: {
        55: {
          ownerId: 999,
          prefs: {
            allowRoomCollaboratorsToSendVisualizer: false,
          },
        },
      },
    })

    const { sock, broadcastEmit } = createMockSocket({ userId: 101, roomId: 55, isAdmin: false })

    await handlers[VISUALIZER_HYDRA_CODE_REQ](sock, { payload: { code: 'osc(10).out()' } })

    expect(broadcastEmit).not.toHaveBeenCalled()
  })

  it('allows hydra code broadcast when collaborator send is enabled', async () => {
    vi.mocked(Rooms.get).mockResolvedValue({
      result: [55],
      entities: {
        55: {
          ownerId: 999,
          prefs: {
            allowRoomCollaboratorsToSendVisualizer: true,
          },
        },
      },
    })

    const { sock, broadcastEmit } = createMockSocket({ userId: 101, roomId: 55, isAdmin: false })

    await handlers[VISUALIZER_HYDRA_CODE_REQ](sock, { payload: { code: 'osc(10).out()' } })

    expect(broadcastEmit).toHaveBeenCalledWith('action', {
      type: VISUALIZER_HYDRA_CODE,
      payload: { code: 'osc(10).out()' },
    })
  })

  it('blocks collaborator hydra send when room is restricted to a different party folder', async () => {
    vi.mocked(Rooms.get).mockResolvedValue({
      result: [55],
      entities: {
        55: {
          ownerId: 999,
          prefs: {
            allowRoomCollaboratorsToSendVisualizer: true,
            restrictCollaboratorsToPartyPresetFolder: true,
            partyPresetFolderId: 1,
          },
        },
      },
    })

    const { sock, broadcastEmit } = createMockSocket({ userId: 101, roomId: 55, isAdmin: false })

    await handlers[VISUALIZER_HYDRA_CODE_REQ](sock, { payload: { code: 'osc(10).out()', hydraPresetFolderId: 2 } })

    expect(broadcastEmit).not.toHaveBeenCalled()
  })

  it('allows collaborator hydra send when room is restricted and payload folder matches', async () => {
    vi.mocked(Rooms.get).mockResolvedValue({
      result: [55],
      entities: {
        55: {
          ownerId: 999,
          prefs: {
            allowRoomCollaboratorsToSendVisualizer: true,
            restrictCollaboratorsToPartyPresetFolder: true,
            partyPresetFolderId: 2,
          },
        },
      },
    })

    const { sock, broadcastEmit } = createMockSocket({ userId: 101, roomId: 55, isAdmin: false })

    await handlers[VISUALIZER_HYDRA_CODE_REQ](sock, {
      payload: {
        code: 'osc(10).out()',
        hydraPresetFolderId: 2,
        hydraPresetName: 'Working Standards / ws_a',
      },
    })

    expect(broadcastEmit).toHaveBeenCalledWith('action', {
      type: VISUALIZER_HYDRA_CODE,
      payload: {
        code: 'osc(10).out()',
        hydraPresetFolderId: 2,
        hydraPresetName: 'Working Standards / ws_a',
      },
    })
  })

  it('allows player next command for room owner', async () => {
    vi.mocked(Rooms.get).mockResolvedValue({
      result: [11],
      entities: {
        11: { ownerId: 42 },
      },
    })

    const { sock, broadcastEmit } = createMockSocket({ userId: 42, roomId: 11, isAdmin: false })

    await handlers[PLAYER_REQ_NEXT](sock)

    expect(broadcastEmit).toHaveBeenCalledWith('action', {
      type: PLAYER_CMD_NEXT,
    })
  })

  it('allows hydra code broadcast for room owner', async () => {
    vi.mocked(Rooms.get).mockResolvedValue({
      result: [77],
      entities: {
        77: { ownerId: 200 },
      },
    })

    const { sock, broadcastEmit } = createMockSocket({ userId: 200, roomId: 77, isAdmin: false })

    await handlers[VISUALIZER_HYDRA_CODE_REQ](sock, { payload: { code: 'noise(4).out()' } })

    expect(broadcastEmit).toHaveBeenCalledWith('action', {
      type: VISUALIZER_HYDRA_CODE,
      payload: { code: 'noise(4).out()' },
    })
  })

  it('blocks camera offer when collaborator relay is disabled', async () => {
    vi.mocked(Rooms.get).mockResolvedValue({
      result: [88],
      entities: {
        88: {
          ownerId: 300,
          prefs: {
            allowGuestCameraRelay: false,
          },
        },
      },
    })

    const { sock, othersEmit, socketTo } = createMockSocket({ userId: 301, roomId: 88, isAdmin: false })

    await handlers[CAMERA_OFFER_REQ](sock, { payload: { sdp: 'offer' } })

    expect(othersEmit).not.toHaveBeenCalled()
    expect(socketTo).not.toHaveBeenCalled()
  })

  it('allows camera offer when collaborator relay is enabled', async () => {
    vi.mocked(Rooms.get).mockResolvedValue({
      result: [88],
      entities: {
        88: {
          ownerId: 300,
          prefs: {
            allowGuestCameraRelay: true,
          },
        },
      },
    })

    const { sock, othersEmit, broadcastEmit, socketTo, serverTo } = createMockSocket({ userId: 301, roomId: 88, isAdmin: false })

    await handlers[CAMERA_OFFER_REQ](sock, { payload: { sdp: 'offer' } })

    expect(othersEmit).toHaveBeenCalledWith('action', {
      type: CAMERA_OFFER,
      payload: { sdp: 'offer' },
    })
    expect(socketTo).toHaveBeenCalledWith('ROOM_ID_88')
    expect(serverTo).not.toHaveBeenCalled()
    expect(broadcastEmit).not.toHaveBeenCalled()
  })

  it('does not echo camera offer back to sender socket', async () => {
    vi.mocked(Rooms.get).mockResolvedValue({
      result: [88],
      entities: {
        88: {
          ownerId: 300,
          prefs: {
            allowGuestCameraRelay: true,
          },
        },
      },
    })

    const { sock, othersEmit, broadcastEmit } = createMockSocket({ userId: 301, roomId: 88, isAdmin: false })

    await handlers[CAMERA_OFFER_REQ](sock, { payload: { sdp: 'offer' } })

    expect(othersEmit).toHaveBeenCalledWith('action', {
      type: CAMERA_OFFER,
      payload: { sdp: 'offer' },
    })
    expect(broadcastEmit).not.toHaveBeenCalled()
  })
})
