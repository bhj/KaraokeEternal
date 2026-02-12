import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CAMERA_OFFER,
  CAMERA_OFFER_REQ,
  CAMERA_STOP,
  CAMERA_STOP_REQ,
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
import handlers, { canManageRoom, cleanupCameraPublisher } from './socket.js'

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

function createMockSocket (user: MockSocket['user'], socketId = 'sock-1') {
  const othersEmit = vi.fn()
  const broadcastEmit = vi.fn()
  const serverTo = vi.fn(() => ({ emit: broadcastEmit }))
  const socketTo = vi.fn(() => ({ emit: othersEmit }))
  const sock = {
    id: socketId,
    user,
    to: socketTo,
    server: { to: serverTo },
  }
  return { sock: sock as unknown as MockSocket, othersEmit, broadcastEmit, serverTo, socketTo }
}

function createMockIo () {
  const emit = vi.fn()
  const to = vi.fn(() => ({ emit }))
  return { io: { to }, emit, to }
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

describe('Camera publisher disconnect cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function allowCameraRelay (roomId: number) {
    vi.mocked(Rooms.get).mockResolvedValue({
      result: [roomId],
      entities: {
        [roomId]: {
          ownerId: 999,
          prefs: { allowGuestCameraRelay: true },
        },
      },
    })
  }

  it('broadcasts CAMERA_STOP when publisher socket disconnects', async () => {
    allowCameraRelay(10)
    const { sock } = createMockSocket({ userId: 50, roomId: 10, isAdmin: false }, 'pub-sock')

    // Publisher sends offer → tracked
    await handlers[CAMERA_OFFER_REQ](sock, { payload: { sdp: 'offer' } })

    // Simulate disconnect
    const { io, emit } = createMockIo()
    cleanupCameraPublisher(10, 'pub-sock', io)

    expect(emit).toHaveBeenCalledWith('action', { type: CAMERA_STOP })
  })

  it('does not broadcast CAMERA_STOP when non-publisher socket disconnects', async () => {
    allowCameraRelay(10)
    const { sock } = createMockSocket({ userId: 50, roomId: 10, isAdmin: false }, 'pub-sock')

    // Publisher sends offer → tracked
    await handlers[CAMERA_OFFER_REQ](sock, { payload: { sdp: 'offer' } })

    // Different socket disconnects
    const { io, emit } = createMockIo()
    cleanupCameraPublisher(10, 'other-sock', io)

    expect(emit).not.toHaveBeenCalled()
  })

  it('clears publisher tracking on explicit CAMERA_STOP_REQ', async () => {
    allowCameraRelay(10)
    const { sock } = createMockSocket({ userId: 50, roomId: 10, isAdmin: false }, 'pub-sock')

    // Publisher sends offer → tracked
    await handlers[CAMERA_OFFER_REQ](sock, { payload: { sdp: 'offer' } })

    // Publisher sends explicit stop
    await handlers[CAMERA_STOP_REQ](sock, { payload: {} })

    // Now disconnect should NOT broadcast again (already stopped)
    const { io, emit } = createMockIo()
    cleanupCameraPublisher(10, 'pub-sock', io)

    expect(emit).not.toHaveBeenCalled()
  })

  it('new publisher takeover replaces previous publisher for same room', async () => {
    allowCameraRelay(20)
    const { sock: sock1 } = createMockSocket({ userId: 50, roomId: 20, isAdmin: false }, 'pub-1')
    const { sock: sock2 } = createMockSocket({ userId: 60, roomId: 20, isAdmin: false }, 'pub-2')

    // First publisher sends offer
    await handlers[CAMERA_OFFER_REQ](sock1, { payload: { sdp: 'offer-1' } })

    // Second publisher takes over
    await handlers[CAMERA_OFFER_REQ](sock2, { payload: { sdp: 'offer-2' } })

    // Old publisher disconnects → should NOT trigger CAMERA_STOP (replaced)
    const { io: io1, emit: emit1 } = createMockIo()
    cleanupCameraPublisher(20, 'pub-1', io1)
    expect(emit1).not.toHaveBeenCalled()

    // New publisher disconnects → should trigger CAMERA_STOP
    const { io: io2, emit: emit2 } = createMockIo()
    cleanupCameraPublisher(20, 'pub-2', io2)
    expect(emit2).toHaveBeenCalledWith('action', { type: CAMERA_STOP })
  })

  it('cleanup is scoped to correct room in multi-room scenario', async () => {
    // Mock Rooms.get to allow camera relay for any room
    vi.mocked(Rooms.get).mockImplementation(async (roomId: number) => ({
      result: [roomId],
      entities: {
        [roomId]: {
          ownerId: 999,
          prefs: { allowGuestCameraRelay: true },
        },
      },
    }))

    const { sock: sockA } = createMockSocket({ userId: 50, roomId: 30, isAdmin: false }, 'pub-a')
    const { sock: sockB } = createMockSocket({ userId: 60, roomId: 40, isAdmin: false }, 'pub-b')

    // Publishers in different rooms
    await handlers[CAMERA_OFFER_REQ](sockA, { payload: { sdp: 'offer-a' } })
    await handlers[CAMERA_OFFER_REQ](sockB, { payload: { sdp: 'offer-b' } })

    // Disconnect publisher from room 30 → only room 30 gets CAMERA_STOP
    const { io, emit, to } = createMockIo()
    cleanupCameraPublisher(30, 'pub-a', io)

    expect(to).toHaveBeenCalledWith('ROOM_ID_30')
    expect(emit).toHaveBeenCalledWith('action', { type: CAMERA_STOP })

    // Room 40 publisher still tracked — disconnect triggers CAMERA_STOP for room 40
    const { io: io2, emit: emit2, to: to2 } = createMockIo()
    cleanupCameraPublisher(40, 'pub-b', io2)

    expect(to2).toHaveBeenCalledWith('ROOM_ID_40')
    expect(emit2).toHaveBeenCalledWith('action', { type: CAMERA_STOP })
  })
})
