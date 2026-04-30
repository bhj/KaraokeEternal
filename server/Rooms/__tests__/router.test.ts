import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'
import http from 'node:http'
import Koa from 'koa'
import { koaBody } from 'koa-body'

const fakeDb = { get: vi.fn(), run: vi.fn(), all: vi.fn(), exec: vi.fn() }

vi.mock('../../lib/Database.js', () => ({
  db: fakeDb,
  default: { refs: { db: fakeDb } },
  open: vi.fn(),
  close: vi.fn(),
  DatabaseWrapper: class {},
}))

const Rooms = (await import('../Rooms.js')).default
const router = (await import('../router.js')).default

interface FakeUser {
  userId: number | null
  isAdmin: boolean
  isGuest?: boolean
  role?: string | null
  name: string
  roomId: number | null
}

let server: http.Server
let baseUrl: string
let currentUser: FakeUser = { userId: 1, isAdmin: true, role: 'admin', name: 'admin', roomId: null }

const fakeIo = {
  sockets: { adapter: { rooms: new Map() } },
  in: () => ({ fetchSockets: async () => [] }),
  to: () => ({ emit: () => {} }),
}

beforeAll(async () => {
  const app = new Koa()
  app.use(async (ctx, next) => {
    ctx.user = currentUser
    ctx.io = fakeIo as any
    try {
      await next()
    } catch (err: any) {
      ctx.status = err.status || 500
      ctx.body = { error: err.message }
    }
  })
  app.use(koaBody())
  app.use(router.routes())
  server = http.createServer(app.callback())
  await new Promise<void>(resolve => server.listen(0, resolve))
  const addr = server.address() as { port: number }
  baseUrl = `http://127.0.0.1:${addr.port}`
})

afterAll(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()))
})

beforeEach(() => {
  currentUser = { userId: 1, isAdmin: true, role: 'admin', name: 'admin', roomId: null }
  vi.restoreAllMocks()
  fakeDb.all.mockReturnValue([])
  fakeDb.get.mockReturnValue(undefined)
  fakeDb.run.mockReturnValue({ lastID: 1, changes: 1 })
  // Rooms.get is invoked at the end of most handlers to build the response — return empty
  vi.spyOn(Rooms, 'get').mockReturnValue({ result: [], entities: {} } as any)
  vi.spyOn(Rooms, 'set').mockResolvedValue({ lastID: 7, changes: 1 } as any)
  vi.spyOn(Rooms, 'setManagers').mockImplementation(() => {})
  vi.spyOn(Rooms, 'getManagedRoomIds').mockReturnValue([])
  vi.spyOn(Rooms, 'isManager').mockReturnValue(false)
  vi.spyOn(Rooms, 'clearQueue').mockReturnValue(0)
})

describe('Rooms router — POST / (create)', () => {
  it('rejects non-admin', async () => {
    currentUser = { userId: 2, isAdmin: false, role: 'standard', name: 'std', roomId: null }
    const res = await fetch(`${baseUrl}/api/rooms`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'r', status: 'open' }),
    })
    expect(res.status).toBe(401)
  })

  it('rejects room_manager (cannot create rooms)', async () => {
    currentUser = { userId: 2, isAdmin: false, role: 'room_manager', name: 'mgr', roomId: null }
    const res = await fetch(`${baseUrl}/api/rooms`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'r', status: 'open' }),
    })
    expect(res.status).toBe(401)
  })

  it('admin can create a room with managers', async () => {
    const res = await fetch(`${baseUrl}/api/rooms`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'r', status: 'open', managers: [10, 11] }),
    })
    expect(res.status).toBe(200)
    expect(Rooms.set).toHaveBeenCalledOnce()
    expect(Rooms.setManagers).toHaveBeenCalledWith(7, [10, 11])
  })
})

describe('Rooms router — PUT /:roomId (update)', () => {
  it('rejects non-admin non-manager', async () => {
    currentUser = { userId: 2, isAdmin: false, role: 'standard', name: 'std', roomId: 1 }
    const res = await fetch(`${baseUrl}/api/rooms/1`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'new', status: 'open' }),
    })
    expect(res.status).toBe(401)
  })

  it('rejects room_manager who does not manage that room', async () => {
    currentUser = { userId: 2, isAdmin: false, role: 'room_manager', name: 'mgr', roomId: 1 }
    vi.spyOn(Rooms, 'isManager').mockReturnValue(false)
    const res = await fetch(`${baseUrl}/api/rooms/1`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'new', status: 'open' }),
    })
    expect(res.status).toBe(401)
  })

  it('allows room_manager who manages that room', async () => {
    currentUser = { userId: 2, isAdmin: false, role: 'room_manager', name: 'mgr', roomId: 1 }
    vi.spyOn(Rooms, 'isManager').mockReturnValue(true)
    const res = await fetch(`${baseUrl}/api/rooms/1`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'new', status: 'open' }),
    })
    expect(res.status).toBe(200)
    expect(Rooms.set).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'new', status: 'open' }))
  })

  it('strips managers field when caller is a manager (cannot escalate)', async () => {
    currentUser = { userId: 2, isAdmin: false, role: 'room_manager', name: 'mgr', roomId: 1 }
    vi.spyOn(Rooms, 'isManager').mockReturnValue(true)
    const res = await fetch(`${baseUrl}/api/rooms/1`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'new', status: 'open', managers: [99] }),
    })
    expect(res.status).toBe(200)
    // setManagers must not be called for non-admin callers
    expect(Rooms.setManagers).not.toHaveBeenCalled()
    // and the body passed to set() should not contain `managers`
    const setArg = (Rooms.set as any).mock.calls[0][1]
    expect(setArg).not.toHaveProperty('managers')
  })

  it('admin can change managers list', async () => {
    const res = await fetch(`${baseUrl}/api/rooms/1`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'new', status: 'open', managers: [42] }),
    })
    expect(res.status).toBe(200)
    expect(Rooms.setManagers).toHaveBeenCalledWith(1, [42])
  })
})

describe('Rooms router — DELETE /:roomId', () => {
  it('rejects room_manager (cannot delete rooms)', async () => {
    currentUser = { userId: 2, isAdmin: false, role: 'room_manager', name: 'mgr', roomId: 1 }
    vi.spyOn(Rooms, 'isManager').mockReturnValue(true)
    const res = await fetch(`${baseUrl}/api/rooms/1`, { method: 'DELETE' })
    expect(res.status).toBe(401)
  })

  it('admin can delete', async () => {
    const res = await fetch(`${baseUrl}/api/rooms/1`, { method: 'DELETE' })
    expect(res.status).toBe(200)
  })
})

describe('Rooms router — POST /:roomId/clear', () => {
  it('rejects non-admin non-manager', async () => {
    currentUser = { userId: 2, isAdmin: false, role: 'standard', name: 'std', roomId: 1 }
    const res = await fetch(`${baseUrl}/api/rooms/1/clear`, { method: 'POST' })
    expect(res.status).toBe(401)
  })

  it('rejects room_manager not managing that room', async () => {
    currentUser = { userId: 2, isAdmin: false, role: 'room_manager', name: 'mgr', roomId: 1 }
    vi.spyOn(Rooms, 'isManager').mockReturnValue(false)
    const res = await fetch(`${baseUrl}/api/rooms/1/clear`, { method: 'POST' })
    expect(res.status).toBe(401)
  })

  it('allows admin', async () => {
    vi.spyOn(Rooms, 'clearQueue').mockReturnValue(3)
    const res = await fetch(`${baseUrl}/api/rooms/1/clear`, { method: 'POST' })
    expect(res.status).toBe(200)
    expect(Rooms.clearQueue).toHaveBeenCalledWith(1)
    const body = await res.json() as { roomId: number, removed: number }
    expect(body).toEqual({ roomId: 1, removed: 3 })
  })

  it('allows room_manager who manages that room', async () => {
    currentUser = { userId: 2, isAdmin: false, role: 'room_manager', name: 'mgr', roomId: 1 }
    vi.spyOn(Rooms, 'isManager').mockReturnValue(true)
    vi.spyOn(Rooms, 'clearQueue').mockReturnValue(0)
    const res = await fetch(`${baseUrl}/api/rooms/1/clear`, { method: 'POST' })
    expect(res.status).toBe(200)
  })
})
