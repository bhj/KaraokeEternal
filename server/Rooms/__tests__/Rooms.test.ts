import { describe, it, expect, beforeEach, vi } from 'vitest'

const fakeDb = { get: vi.fn(), run: vi.fn(), all: vi.fn(), exec: vi.fn() }

vi.mock('../../lib/Database.js', () => ({
  db: fakeDb,
  default: { refs: { db: fakeDb } },
  open: vi.fn(),
  close: vi.fn(),
  DatabaseWrapper: class {},
}))

const Rooms = (await import('../Rooms.js')).default

beforeEach(() => {
  fakeDb.get.mockReset()
  fakeDb.run.mockReset()
  fakeDb.all.mockReset()
  fakeDb.exec.mockReset()
  fakeDb.run.mockReturnValue({ lastID: 1, changes: 1 })
  fakeDb.all.mockReturnValue([])
})

describe('Rooms.setManagers', () => {
  it('rejects non-array input', () => {
    expect(() => Rooms.setManagers(1, 'oops' as unknown as number[])).toThrow(/array/i)
  })

  it('rejects non-positive ids', () => {
    expect(() => Rooms.setManagers(1, [0, 5])).toThrow(/invalid userId/i)
    expect(() => Rooms.setManagers(1, [-1])).toThrow(/invalid userId/i)
  })

  it('rejects users that do not have the room_manager role', () => {
    // verify query returns only id 5; id 6 is missing
    fakeDb.all.mockReturnValueOnce([{ userId: 5 }])
    expect(() => Rooms.setManagers(1, [5, 6])).toThrow(/room_manager role/i)
  })

  it('replaces managers atomically when all userIds verify', () => {
    fakeDb.all.mockReturnValueOnce([{ userId: 5 }, { userId: 6 }])

    Rooms.setManagers(1, [5, 6, 5]) // duplicate de-dupes

    expect(fakeDb.exec).toHaveBeenCalledWith('BEGIN')
    expect(fakeDb.exec).toHaveBeenCalledWith('COMMIT')
    // 1 DELETE + 2 INSERTs
    const deletes = fakeDb.run.mock.calls.filter(c => /DELETE FROM roomManagers/i.test(c[0]))
    const inserts = fakeDb.run.mock.calls.filter(c => /INSERT INTO roomManagers/i.test(c[0]))
    expect(deletes).toHaveLength(1)
    expect(inserts).toHaveLength(2)
  })

  it('rolls back on insert failure', () => {
    fakeDb.all.mockReturnValueOnce([{ userId: 5 }])
    fakeDb.run
      .mockReturnValueOnce({ changes: 1 }) // DELETE
      .mockImplementationOnce(() => { throw new Error('boom') }) // INSERT fails

    expect(() => Rooms.setManagers(1, [5])).toThrow('boom')
    expect(fakeDb.exec).toHaveBeenCalledWith('ROLLBACK')
  })

  it('empty array clears managers without verification query', () => {
    Rooms.setManagers(1, [])

    expect(fakeDb.all).not.toHaveBeenCalled()
    expect(fakeDb.run).toHaveBeenCalledOnce() // only the DELETE
  })
})

describe('Rooms.isManager / getManagedRoomIds', () => {
  it('isManager returns true when row exists', () => {
    fakeDb.get.mockReturnValueOnce({ one: 1 })
    expect(Rooms.isManager(1, 5)).toBe(true)
  })

  it('isManager returns false when row missing', () => {
    fakeDb.get.mockReturnValueOnce(undefined)
    expect(Rooms.isManager(1, 5)).toBe(false)
  })

  it('isManager returns false for non-numeric ids', () => {
    expect(Rooms.isManager(1, 'x' as unknown as number)).toBe(false)
    expect(fakeDb.get).not.toHaveBeenCalled()
  })

  it('getManagedRoomIds returns array of roomIds', () => {
    fakeDb.all.mockReturnValueOnce([{ roomId: 1 }, { roomId: 3 }])
    expect(Rooms.getManagedRoomIds(5)).toEqual([1, 3])
  })

  it('getManagedRoomIds returns [] for non-numeric userId', () => {
    expect(Rooms.getManagedRoomIds('x' as unknown as number)).toEqual([])
    expect(fakeDb.all).not.toHaveBeenCalled()
  })
})

describe('Rooms.clearQueue', () => {
  it('returns affected row count', () => {
    fakeDb.run.mockReturnValueOnce({ changes: 4 })
    expect(Rooms.clearQueue(1)).toBe(4)
    expect(fakeDb.run).toHaveBeenCalledWith(expect.stringMatching(/DELETE FROM queue/i), expect.any(Array))
  })
})
