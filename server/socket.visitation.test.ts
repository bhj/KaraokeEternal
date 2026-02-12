import { describe, it, expect, vi, beforeEach } from 'vitest'
import Rooms from './Rooms/Rooms.js'
import { resolveSocketRoomIdFromCookie } from './socket.js'

describe('resolveSocketRoomIdFromCookie', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns existing room for guests', async () => {
    const validateSpy = vi.spyOn(Rooms, 'validate')

    const result = await resolveSocketRoomIdFromCookie(
      { isGuest: true, roomId: 11 },
      'keVisitedRoom=22',
      true,
    )

    expect(result).toBe(11)
    expect(validateSpy).not.toHaveBeenCalled()
  })

  it('returns existing room when ephemeral visitation is disabled', async () => {
    const validateSpy = vi.spyOn(Rooms, 'validate')

    const result = await resolveSocketRoomIdFromCookie(
      { isGuest: false, roomId: 11 },
      'keVisitedRoom=22',
      false,
    )

    expect(result).toBe(11)
    expect(validateSpy).not.toHaveBeenCalled()
  })

  it('returns visited room when cookie target is valid/open', async () => {
    const validateSpy = vi.spyOn(Rooms, 'validate').mockResolvedValue(undefined)
    const updateSpy = vi.spyOn(Rooms, 'updateActivity').mockResolvedValue({} as never)

    const result = await resolveSocketRoomIdFromCookie(
      { isGuest: false, roomId: 11 },
      'keVisitedRoom=22',
      true,
    )

    expect(result).toBe(22)
    expect(validateSpy).toHaveBeenCalledWith(22, null, { isOpen: true })
    expect(updateSpy).toHaveBeenCalledWith(22)
  })

  it('keeps existing room when visited room validation fails', async () => {
    const validateSpy = vi.spyOn(Rooms, 'validate').mockRejectedValue(new Error('closed'))
    const updateSpy = vi.spyOn(Rooms, 'updateActivity')

    const result = await resolveSocketRoomIdFromCookie(
      { isGuest: false, roomId: 11 },
      'keVisitedRoom=22',
      true,
    )

    expect(result).toBe(11)
    expect(validateSpy).toHaveBeenCalledWith(22, null, { isOpen: true })
    expect(updateSpy).not.toHaveBeenCalled()
  })
})
