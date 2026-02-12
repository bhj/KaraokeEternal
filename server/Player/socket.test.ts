import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CAMERA_ANSWER,
  CAMERA_ANSWER_REQ,
  CAMERA_ICE,
  CAMERA_ICE_REQ,
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

import Rooms from '../Rooms/Rooms.js'
import handlers, { canManageRoom } from './socket.js'

interface MockSocket {
  id: string
  user: {
    userId: number
    roomId: number
    isAdmin: boolean
  }
  server: {
    to: ReturnType<typeof vi.fn>
    in: ReturnType<typeof vi.fn>
  }
  _lastPlayerStatus?: unknown
}

function createServerHarness () {
  const emitsByTarget = new Map<string, ReturnType<typeof vi.fn>>()
  const to = vi.fn((target: string) => {
    let emit = emitsByTarget.get(target)
    if (!emit) {
      emit = vi.fn()
      emitsByTarget.set(target, emit)
    }

    return { emit }
  })
  const fetchSockets = vi.fn(async () => [] as MockSocket[])
  const inRoom = vi.fn(() => ({ fetchSockets }))

  return {
    server: { to, in: inRoom },
    emitsByTarget,
    to,
    inRoom,
    fetchSockets,
  }
}

function createMockSocket (
  user: MockSocket['user'],
  {
    id,
    server,
  }: {
    id?: string
    server?: MockSocket['server']
  } = {},
) {
  const harness = createServerHarness()
  const sock = {
    id: id ?? `sock_${user.userId}`,
    user,
    server: server ?? harness.server,
  }
  return {
    sock: sock as unknown as MockSocket,
    harness,
  }
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
    } as any)

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

    const { sock, harness } = createMockSocket({ userId: 101, roomId: 55, isAdmin: false })

    await handlers[VISUALIZER_HYDRA_CODE_REQ](sock, { payload: { code: 'osc(10).out()' } })

    expect(harness.emitsByTarget.get('ROOM_ID_55')).toBeUndefined()
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

    const { sock, harness } = createMockSocket({ userId: 101, roomId: 55, isAdmin: false })

    await handlers[VISUALIZER_HYDRA_CODE_REQ](sock, { payload: { code: 'osc(10).out()' } })

    expect(harness.emitsByTarget.get('ROOM_ID_55')).toHaveBeenCalledWith('action', {
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

    const { sock, harness } = createMockSocket({ userId: 101, roomId: 55, isAdmin: false })

    await handlers[VISUALIZER_HYDRA_CODE_REQ](sock, { payload: { code: 'osc(10).out()', hydraPresetFolderId: 2 } })

    expect(harness.emitsByTarget.get('ROOM_ID_55')).toBeUndefined()
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

    const { sock, harness } = createMockSocket({ userId: 101, roomId: 55, isAdmin: false })

    await handlers[VISUALIZER_HYDRA_CODE_REQ](sock, {
      payload: {
        code: 'osc(10).out()',
        hydraPresetFolderId: 2,
        hydraPresetName: 'Working Standards / ws_a',
      },
    })

    expect(harness.emitsByTarget.get('ROOM_ID_55')).toHaveBeenCalledWith('action', {
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

    const { sock, harness } = createMockSocket({ userId: 42, roomId: 11, isAdmin: false })

    await handlers[PLAYER_REQ_NEXT](sock)

    expect(harness.emitsByTarget.get('ROOM_ID_11')).toHaveBeenCalledWith('action', {
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

    const { sock, harness } = createMockSocket({ userId: 200, roomId: 77, isAdmin: false })

    await handlers[VISUALIZER_HYDRA_CODE_REQ](sock, { payload: { code: 'noise(4).out()' } })

    expect(harness.emitsByTarget.get('ROOM_ID_77')).toHaveBeenCalledWith('action', {
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

    const { sock, harness } = createMockSocket({ userId: 301, roomId: 88, isAdmin: false })

    await handlers[CAMERA_OFFER_REQ](sock, { payload: { sdp: 'offer' } })

    expect(harness.emitsByTarget.size).toBe(0)
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

    const { sock, harness } = createMockSocket({ userId: 301, roomId: 88, isAdmin: false })

    await handlers[CAMERA_OFFER_REQ](sock, { payload: { sdp: 'offer' } })

    expect(harness.emitsByTarget.get('ROOM_ID_88')).toHaveBeenCalledWith('action', {
      type: CAMERA_OFFER,
      payload: { sdp: 'offer' },
    })
  })

  it('broadcasts camera offer to room so first available player can answer', async () => {
    vi.mocked(Rooms.get).mockResolvedValue({
      result: [189],
      entities: {
        189: {
          ownerId: 700,
          prefs: {
            allowGuestCameraRelay: true,
          },
        },
      },
    })

    const shared = createServerHarness()
    const { sock: publisher } = createMockSocket(
      { userId: 701, roomId: 189, isAdmin: false },
      { id: 'publisher-1', server: shared.server },
    )

    await handlers[CAMERA_OFFER_REQ](publisher, { payload: { sdp: 'offer', type: 'offer' } })

    expect(shared.emitsByTarget.get('ROOM_ID_189')).toHaveBeenCalledWith('action', {
      type: CAMERA_OFFER,
      payload: { sdp: 'offer', type: 'offer' },
    })
    expect(shared.emitsByTarget.get('player-1')).toBeUndefined()
  })

  it('routes camera answer back to originating publisher socket', async () => {
    vi.mocked(Rooms.get).mockResolvedValue({
      result: [190],
      entities: {
        190: {
          ownerId: 710,
          prefs: {
            allowGuestCameraRelay: true,
          },
        },
      },
    })

    const shared = createServerHarness()
    const { sock: publisher } = createMockSocket(
      { userId: 711, roomId: 190, isAdmin: false },
      { id: 'publisher-2', server: shared.server },
    )
    const { sock: subscriber } = createMockSocket(
      { userId: 712, roomId: 190, isAdmin: false },
      { id: 'player-2', server: shared.server },
    )

    const playerSocket = {
      ...subscriber,
      _lastPlayerStatus: { queueId: 1 },
    } as unknown as MockSocket

    shared.fetchSockets.mockResolvedValue([publisher, playerSocket])

    await handlers[CAMERA_OFFER_REQ](publisher, { payload: { sdp: 'offer', type: 'offer' } })
    await handlers[CAMERA_ANSWER_REQ](subscriber, { payload: { sdp: 'answer', type: 'answer' } })

    expect(shared.emitsByTarget.get('publisher-2')).toHaveBeenCalledWith('action', {
      type: CAMERA_ANSWER,
      payload: { sdp: 'answer', type: 'answer' },
    })
    expect(shared.emitsByTarget.get('ROOM_ID_190')).toHaveBeenCalledWith('action', {
      type: CAMERA_OFFER,
      payload: { sdp: 'offer', type: 'offer' },
    })
  })

  it('locks route to first answering subscriber after fallback offer broadcast', async () => {
    vi.mocked(Rooms.get).mockResolvedValue({
      result: [191],
      entities: {
        191: {
          ownerId: 720,
          prefs: {
            allowGuestCameraRelay: true,
          },
        },
      },
    })

    const shared = createServerHarness()
    const { sock: publisher } = createMockSocket(
      { userId: 721, roomId: 191, isAdmin: false },
      { id: 'publisher-3', server: shared.server },
    )
    const { sock: subscriber } = createMockSocket(
      { userId: 722, roomId: 191, isAdmin: false },
      { id: 'player-3', server: shared.server },
    )

    // No active player known at offer time; falls back to room broadcast.
    shared.fetchSockets.mockResolvedValue([publisher, subscriber])

    await handlers[CAMERA_OFFER_REQ](publisher, { payload: { sdp: 'offer', type: 'offer' } })
    await handlers[CAMERA_ANSWER_REQ](subscriber, { payload: { sdp: 'answer', type: 'answer' } })
    await handlers[CAMERA_ICE_REQ](publisher, {
      payload: { candidate: 'cand-1', sdpMid: '0', sdpMLineIndex: 0 },
    })

    expect(shared.emitsByTarget.get('player-3')).toHaveBeenCalledWith('action', {
      type: CAMERA_ICE,
      payload: { candidate: 'cand-1', sdpMid: '0', sdpMLineIndex: 0 },
    })
  })

  it('broadcasts publisher ICE to room before subscriber is pinned', async () => {
    vi.mocked(Rooms.get).mockResolvedValue({
      result: [192],
      entities: {
        192: {
          ownerId: 730,
          prefs: {
            allowGuestCameraRelay: true,
          },
        },
      },
    })

    const shared = createServerHarness()
    const { sock: publisher } = createMockSocket(
      { userId: 731, roomId: 192, isAdmin: false },
      { id: 'publisher-4', server: shared.server },
    )

    // No active player detected, so offer and early ICE should fan out to room.
    shared.fetchSockets.mockResolvedValue([publisher])

    await handlers[CAMERA_OFFER_REQ](publisher, { payload: { sdp: 'offer', type: 'offer' } })
    await handlers[CAMERA_ICE_REQ](publisher, {
      payload: { candidate: 'cand-pre-answer', sdpMid: '0', sdpMLineIndex: 0 },
    })

    expect(shared.emitsByTarget.get('ROOM_ID_192')).toHaveBeenCalledWith('action', {
      type: CAMERA_ICE,
      payload: { candidate: 'cand-pre-answer', sdpMid: '0', sdpMLineIndex: 0 },
    })
  })

  it('does not reuse stale subscriber route when no active player is detected', async () => {
    vi.mocked(Rooms.get).mockResolvedValue({
      result: [193],
      entities: {
        193: {
          ownerId: 740,
          prefs: {
            allowGuestCameraRelay: true,
          },
        },
      },
    })

    const shared = createServerHarness()
    const { sock: publisher } = createMockSocket(
      { userId: 741, roomId: 193, isAdmin: false },
      { id: 'publisher-5', server: shared.server },
    )

    const oldPlayer = {
      id: 'player-old',
      user: { userId: 742, roomId: 193, isAdmin: false },
      _lastPlayerStatus: { queueId: 1 },
      server: shared.server,
    } as unknown as MockSocket

    // First offer pins to old player route.
    shared.fetchSockets.mockResolvedValueOnce([publisher, oldPlayer])
    await handlers[CAMERA_OFFER_REQ](publisher, { payload: { sdp: 'offer-1', type: 'offer' } })

    // Next offer has no active player; should broadcast, not target stale socket.
    shared.fetchSockets.mockResolvedValueOnce([publisher])
    await handlers[CAMERA_OFFER_REQ](publisher, { payload: { sdp: 'offer-2', type: 'offer' } })

    expect(shared.emitsByTarget.get('ROOM_ID_193')).toHaveBeenCalledWith('action', {
      type: CAMERA_OFFER,
      payload: { sdp: 'offer-2', type: 'offer' },
    })
  })

  it('ignores unexpected sender while preserving pinned subscriber route', async () => {
    vi.mocked(Rooms.get).mockResolvedValue({
      result: [194],
      entities: {
        194: {
          ownerId: 750,
          prefs: {
            allowGuestCameraRelay: true,
          },
        },
      },
    })

    const shared = createServerHarness()
    const { sock: publisher } = createMockSocket(
      { userId: 751, roomId: 194, isAdmin: false },
      { id: 'publisher-6', server: shared.server },
    )
    const { sock: subscriber } = createMockSocket(
      { userId: 752, roomId: 194, isAdmin: false },
      { id: 'player-6', server: shared.server },
    )
    const { sock: unexpected } = createMockSocket(
      { userId: 753, roomId: 194, isAdmin: false },
      { id: 'other-6', server: shared.server },
    )

    const activePlayer = {
      ...subscriber,
      _lastPlayerStatus: { queueId: 1 },
    } as unknown as MockSocket

    shared.fetchSockets.mockResolvedValue([publisher, activePlayer, unexpected])

    await handlers[CAMERA_OFFER_REQ](publisher, { payload: { sdp: 'offer', type: 'offer' } })
    await handlers[CAMERA_ANSWER_REQ](subscriber, { payload: { sdp: 'answer', type: 'answer' } })

    await handlers[CAMERA_ICE_REQ](unexpected, {
      payload: { candidate: 'cand-unexpected', sdpMid: '0', sdpMLineIndex: 0 },
    })

    await handlers[CAMERA_ICE_REQ](publisher, {
      payload: { candidate: 'cand-from-publisher', sdpMid: '0', sdpMLineIndex: 0 },
    })

    expect(shared.emitsByTarget.get('ROOM_ID_194')).toHaveBeenCalledWith('action', {
      type: CAMERA_OFFER,
      payload: { sdp: 'offer', type: 'offer' },
    })

    expect(shared.emitsByTarget.get('ROOM_ID_194')).not.toHaveBeenCalledWith('action', {
      type: CAMERA_ICE,
      payload: { candidate: 'cand-unexpected', sdpMid: '0', sdpMLineIndex: 0 },
    })

    expect(shared.emitsByTarget.get('player-6')).toHaveBeenCalledWith('action', {
      type: CAMERA_ICE,
      payload: { candidate: 'cand-from-publisher', sdpMid: '0', sdpMLineIndex: 0 },
    })
  })
})
