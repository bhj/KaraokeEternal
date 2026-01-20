import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import fse from 'fs-extra'
import { QUEUE_MOVE, QUEUE_REMOVE } from '../../shared/actionTypes.js'

const TEST_DB_PATH = '/tmp/karaoke-eternal-test-queue-socket.sqlite'

// Mock AuthentikClient to avoid external calls
vi.mock('../lib/AuthentikClient.js', () => ({
  AuthentikClient: {
    createInvitation: vi.fn().mockResolvedValue('mock-invitation-token'),
    cleanupRoom: vi.fn().mockResolvedValue(undefined),
  },
}))

// We need to dynamically import after database is open
let Rooms: typeof import('../Rooms/Rooms.js').default
let Queue: typeof import('./Queue.js').default
let db: typeof import('../lib/Database.js').default
let User: typeof import('../User/User.js').default
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ACTION_HANDLERS: Record<string, (sock: any, action: any, acknowledge: any) => Promise<void>>

describe('Queue socket handlers - room owner permissions', () => {
  let roomOwner: Awaited<ReturnType<typeof User.getOrCreateFromHeader>>
  let guestUser: Awaited<ReturnType<typeof User.getOrCreateFromHeader>>
  let roomId: number
  let testSongId: number
  let testArtistId: number
  let testPathId: number

  beforeAll(async () => {
    // Remove any existing test database
    await fse.remove(TEST_DB_PATH)

    // Open fresh test database with migrations FIRST
    const Database = await import('../lib/Database.js')
    await Database.open({ file: TEST_DB_PATH, ro: false })
    db = Database.default

    // NOW import modules (after db is initialized)
    const RoomsModule = await import('../Rooms/Rooms.js')
    Rooms = RoomsModule.default

    const QueueModule = await import('./Queue.js')
    Queue = QueueModule.default

    const UserModule = await import('../User/User.js')
    User = UserModule.default

    const SocketModule = await import('./socket.js')
    ACTION_HANDLERS = SocketModule.default

    // Create test path for media
    const pathRes = await db.db?.run(
      'INSERT INTO paths (path, priority, data) VALUES (?, ?, ?)',
      ['/test/path', 0, JSON.stringify({ prefs: {} })],
    )
    testPathId = pathRes!.lastID!

    // Create test artist
    const artistRes = await db.db?.run(
      'INSERT INTO artists (name, nameNorm) VALUES (?, ?)',
      ['Test Artist', 'test artist'],
    )
    testArtistId = artistRes!.lastID!

    // Create test song
    const songRes = await db.db?.run(
      'INSERT INTO songs (artistId, title, titleNorm) VALUES (?, ?, ?)',
      [testArtistId, 'Test Song', 'test song'],
    )
    testSongId = songRes!.lastID!

    // Create test media for the song
    await db.db?.run(
      'INSERT INTO media (songId, pathId, relPath, duration) VALUES (?, ?, ?, ?)',
      [testSongId, testPathId, 'test.cdg', 180],
    )
  })

  afterAll(async () => {
    const Database = await import('../lib/Database.js')
    await Database.close()
    await fse.remove(TEST_DB_PATH)
  })

  beforeEach(async () => {
    // Clean up between tests (order matters for FK constraints)
    await db.db?.run('DELETE FROM queue')
    await db.db?.run('DELETE FROM rooms')
    await db.db?.run('DELETE FROM users')

    // Create room owner and guest users
    roomOwner = await User.getOrCreateFromHeader('roomowner', false, false)
    guestUser = await User.getOrCreateFromHeader('guestuser', false, false)

    // Create ephemeral room owned by roomOwner
    roomId = await Rooms.createEphemeral(roomOwner.userId, 'Test Room')
  })

  // Helper to create mock socket
  const createMockSocket = (user: { userId: number, isAdmin: boolean, roomId: number }) => ({
    user: {
      userId: user.userId,
      isAdmin: user.isAdmin,
      roomId: user.roomId,
    },
    server: {
      to: () => ({
        emit: vi.fn(),
      }),
    },
  })

  describe('QUEUE_MOVE', () => {
    it('should allow room owner to move another user\'s queue item', async () => {
      // Add a song to queue as guest
      await Queue.add({ roomId, songId: testSongId, userId: guestUser.userId })

      // Get the queue to find the queueId
      const queueResult = await Queue.get(roomId)
      const guestQueueId = queueResult.result[0]

      // Create mock socket for room owner (not admin)
      const mockSock = createMockSocket({
        userId: roomOwner.userId,
        isAdmin: false,
        roomId,
      })

      // Try to move guest's song as room owner
      const acknowledge = vi.fn()
      await ACTION_HANDLERS[QUEUE_MOVE](
        mockSock,
        { type: 'QUEUE_MOVE', payload: { queueId: guestQueueId, prevQueueId: -1 } },
        acknowledge,
      )

      // Should succeed (not return error)
      expect(acknowledge).toHaveBeenCalledWith({ type: QUEUE_MOVE + '_SUCCESS' })
    })

    it('should NOT allow non-owner non-admin to move another user\'s queue item', async () => {
      // Add a song to queue as room owner
      await Queue.add({ roomId, songId: testSongId, userId: roomOwner.userId })

      // Get the queue to find the queueId
      const queueResult = await Queue.get(roomId)
      const ownerQueueId = queueResult.result[0]

      // Create mock socket for guest (not admin, not room owner)
      const mockSock = createMockSocket({
        userId: guestUser.userId,
        isAdmin: false,
        roomId,
      })

      // Try to move owner's song as guest
      const acknowledge = vi.fn()
      await ACTION_HANDLERS[QUEUE_MOVE](
        mockSock,
        { type: 'QUEUE_MOVE', payload: { queueId: ownerQueueId, prevQueueId: -1 } },
        acknowledge,
      )

      // Should fail with error
      expect(acknowledge).toHaveBeenCalledWith({
        type: QUEUE_MOVE + '_ERROR',
        error: 'Cannot move another user\'s song',
      })
    })

    it('should allow admin to move any user\'s queue item', async () => {
      // Add a song to queue as guest
      await Queue.add({ roomId, songId: testSongId, userId: guestUser.userId })

      // Get the queue to find the queueId
      const queueResult = await Queue.get(roomId)
      const guestQueueId = queueResult.result[0]

      // Create mock socket for admin
      const mockSock = createMockSocket({
        userId: 999, // Different user, but admin
        isAdmin: true,
        roomId,
      })

      // Try to move guest's song as admin
      const acknowledge = vi.fn()
      await ACTION_HANDLERS[QUEUE_MOVE](
        mockSock,
        { type: 'QUEUE_MOVE', payload: { queueId: guestQueueId, prevQueueId: -1 } },
        acknowledge,
      )

      // Should succeed
      expect(acknowledge).toHaveBeenCalledWith({ type: QUEUE_MOVE + '_SUCCESS' })
    })
  })

  describe('QUEUE_REMOVE', () => {
    it('should allow room owner to remove another user\'s queue item', async () => {
      // Add a song to queue as guest
      await Queue.add({ roomId, songId: testSongId, userId: guestUser.userId })

      // Get the queue to find the queueId
      const queueResult = await Queue.get(roomId)
      const guestQueueId = queueResult.result[0]

      // Create mock socket for room owner (not admin)
      const mockSock = createMockSocket({
        userId: roomOwner.userId,
        isAdmin: false,
        roomId,
      })

      // Try to remove guest's song as room owner
      const acknowledge = vi.fn()
      await ACTION_HANDLERS[QUEUE_REMOVE](
        mockSock,
        { type: 'QUEUE_REMOVE', payload: { queueId: guestQueueId } },
        acknowledge,
      )

      // Should succeed (not return error)
      expect(acknowledge).toHaveBeenCalledWith({ type: QUEUE_REMOVE + '_SUCCESS' })
    })

    it('should NOT allow non-owner non-admin to remove another user\'s queue item', async () => {
      // Add a song to queue as room owner
      await Queue.add({ roomId, songId: testSongId, userId: roomOwner.userId })

      // Get the queue to find the queueId
      const queueResult = await Queue.get(roomId)
      const ownerQueueId = queueResult.result[0]

      // Create mock socket for guest (not admin, not room owner)
      const mockSock = createMockSocket({
        userId: guestUser.userId,
        isAdmin: false,
        roomId,
      })

      // Try to remove owner's song as guest
      const acknowledge = vi.fn()
      await ACTION_HANDLERS[QUEUE_REMOVE](
        mockSock,
        { type: 'QUEUE_REMOVE', payload: { queueId: ownerQueueId } },
        acknowledge,
      )

      // Should fail with error
      expect(acknowledge).toHaveBeenCalledWith({
        type: QUEUE_REMOVE + '_ERROR',
        error: 'Cannot remove another user\'s song',
      })
    })

    it('should allow admin to remove any user\'s queue item', async () => {
      // Add a song to queue as guest
      await Queue.add({ roomId, songId: testSongId, userId: guestUser.userId })

      // Get the queue to find the queueId
      const queueResult = await Queue.get(roomId)
      const guestQueueId = queueResult.result[0]

      // Create mock socket for admin
      const mockSock = createMockSocket({
        userId: 999, // Different user, but admin
        isAdmin: true,
        roomId,
      })

      // Try to remove guest's song as admin
      const acknowledge = vi.fn()
      await ACTION_HANDLERS[QUEUE_REMOVE](
        mockSock,
        { type: 'QUEUE_REMOVE', payload: { queueId: guestQueueId } },
        acknowledge,
      )

      // Should succeed
      expect(acknowledge).toHaveBeenCalledWith({ type: QUEUE_REMOVE + '_SUCCESS' })
    })

    it('should allow room owner to remove multiple queue items from different users', async () => {
      // Add songs from both users
      await Queue.add({ roomId, songId: testSongId, userId: guestUser.userId })
      await Queue.add({ roomId, songId: testSongId, userId: roomOwner.userId })

      // Get the queue to find the queueIds
      const queueResult = await Queue.get(roomId)
      const allQueueIds = queueResult.result

      // Create mock socket for room owner (not admin)
      const mockSock = createMockSocket({
        userId: roomOwner.userId,
        isAdmin: false,
        roomId,
      })

      // Try to remove both songs as room owner
      const acknowledge = vi.fn()
      await ACTION_HANDLERS[QUEUE_REMOVE](
        mockSock,
        { type: 'QUEUE_REMOVE', payload: { queueId: allQueueIds } },
        acknowledge,
      )

      // Should succeed
      expect(acknowledge).toHaveBeenCalledWith({ type: QUEUE_REMOVE + '_SUCCESS' })
    })
  })
})
