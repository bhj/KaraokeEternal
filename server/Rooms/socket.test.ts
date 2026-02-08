import { describe, it, expect, vi } from 'vitest'
import { ROOM_PREFS_PUSH_REQUEST, _ERROR } from '../../shared/actionTypes.js'

// Mock Rooms module
vi.mock('./Rooms.js', () => ({
  default: {
    prefix: (roomId: number) => `room:${roomId}`,
  },
}))

describe('Rooms socket handler', () => {
  const importHandler = async () => {
    const mod = await import('./socket.js')
    return mod.default[ROOM_PREFS_PUSH_REQUEST]
  }

  const makeSocket = (user: { isAdmin: boolean }, emittedActions: Array<{ socketId: string, action: unknown }>) => ({
    id: 'admin-sock',
    user,
    server: {
      in: () => ({
        fetchSockets: async () => [
          { id: 'admin-sock', user: { isAdmin: true } },
          { id: 'player-sock', user: { isAdmin: false } },
        ],
      }),
      to: (id: string) => ({
        emit: (_event: string, action: unknown) => {
          emittedActions.push({ socketId: id, action })
        },
      }),
    },
  })

  it('rejects non-admin sockets', async () => {
    const handler = await importHandler()
    const ack = vi.fn()
    const emitted: Array<{ socketId: string, action: unknown }> = []
    const sock = makeSocket({ isAdmin: false }, emitted)

    await handler(sock, { payload: { roomId: 1, prefs: { startingPresetId: 5 } } }, ack)

    expect(ack).toHaveBeenCalledWith({
      type: ROOM_PREFS_PUSH_REQUEST + _ERROR,
      error: 'Unauthorized',
    })
    expect(emitted).toHaveLength(0)
  })

  it('broadcasts sanitized prefs to non-admin sockets', async () => {
    const handler = await importHandler()
    const ack = vi.fn()
    const emitted: Array<{ socketId: string, action: unknown }> = []
    const sock = makeSocket({ isAdmin: true }, emitted)

    await handler(sock, {
      payload: {
        roomId: 1,
        prefs: {
          startingPresetId: 5,
          playerPresetFolderId: 3,
          allowGuestOrchestrator: false,
          secretInternalField: 'should-not-leak',
        },
      },
    }, ack)

    // Admin socket gets full prefs
    const adminAction = emitted.find(e => e.socketId === 'admin-sock')
    expect(adminAction).toBeDefined()
    const adminPayload = (adminAction!.action as { payload: { prefs: Record<string, unknown> } }).payload.prefs
    expect(adminPayload.startingPresetId).toBe(5)

    // Non-admin socket gets sanitized prefs (no internal fields leaked)
    const playerAction = emitted.find(e => e.socketId === 'player-sock')
    expect(playerAction).toBeDefined()
    const playerPayload = (playerAction!.action as { payload: { prefs: Record<string, unknown> } }).payload.prefs
    expect(playerPayload.startingPresetId).toBe(5)
    expect(playerPayload.playerPresetFolderId).toBe(3)
    expect(playerPayload).not.toHaveProperty('secretInternalField')
  })
})
