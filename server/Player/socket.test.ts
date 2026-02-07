import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
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
  user: {
    userId: number
    roomId: number
    isAdmin: boolean
  }
  server: {
    to: ReturnType<typeof vi.fn>
  }
}

function createMockSocket (user: MockSocket['user']) {
  const emit = vi.fn()
  const to = vi.fn(() => ({ emit }))
  const sock = {
    user,
    server: { to },
  }
  return { sock: sock as unknown as MockSocket, emit, to }
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

  it('blocks hydra code broadcast when user does not own the room', async () => {
    vi.mocked(Rooms.get).mockResolvedValue({
      result: [55],
      entities: {
        55: { ownerId: 999 },
      },
    })

    const { sock, emit } = createMockSocket({ userId: 101, roomId: 55, isAdmin: false })

    await handlers[VISUALIZER_HYDRA_CODE_REQ](sock, { payload: { code: 'osc(10).out()' } })

    expect(emit).not.toHaveBeenCalled()
  })

  it('allows player next command for room owner', async () => {
    vi.mocked(Rooms.get).mockResolvedValue({
      result: [11],
      entities: {
        11: { ownerId: 42 },
      },
    })

    const { sock, emit } = createMockSocket({ userId: 42, roomId: 11, isAdmin: false })

    await handlers[PLAYER_REQ_NEXT](sock)

    expect(emit).toHaveBeenCalledWith('action', {
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

    const { sock, emit } = createMockSocket({ userId: 200, roomId: 77, isAdmin: false })

    await handlers[VISUALIZER_HYDRA_CODE_REQ](sock, { payload: { code: 'noise(4).out()' } })

    expect(emit).toHaveBeenCalledWith('action', {
      type: VISUALIZER_HYDRA_CODE,
      payload: { code: 'noise(4).out()' },
    })
  })
})
