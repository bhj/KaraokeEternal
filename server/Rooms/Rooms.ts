import bcrypt from '../lib/bcrypt.js'
import sql from 'sqlate'
import Database from '../lib/Database.js'
import { ValidationError } from '../lib/Errors.js'

const { db } = Database
const BCRYPT_ROUNDS = 12
const NAME_MIN_LENGTH = 1
const NAME_MAX_LENGTH = 50
const PASSWORD_MIN_LENGTH = 5
const IDLE_TIMEOUT_MS = 4 * 60 * 60 * 1000 // 4 hours

export const STATUSES = ['open', 'closed']

// Remember which users have been seen in each room
const roomUsers: Map<number, Set<number>> = new Map()

class Rooms {
  /**
   * Get all rooms
   *
   * @param  {Object}
   * @return {Promise}
   */
  static async get (roomId, { status = ['open'], includePassword = false } = {}) {
    const result = []
    const entities = {}
    const whereConditions = []
    let whereClause = sql``

    if (typeof roomId === 'number') {
      whereConditions.push(sql`roomId = ${roomId}`)
    }

    if (status && status.length > 0) {
      whereConditions.push(sql`status IN ${sql.tuple(status)}`)
    }

    if (whereConditions.length > 0) {
      whereClause = sql`WHERE ${whereConditions.reduce((acc, curr, index) => {
        if (index > 0) return sql`${acc} AND ${curr}`
        return curr
      })}`
    }

    const query = sql`
      SELECT *
      FROM rooms
      ${whereClause}
      ORDER BY dateCreated DESC
    `
    const res = await db.all(String(query), query.parameters)

    res.forEach((row) => {
      const data = JSON.parse(row.data)
      row.prefs = data.prefs ?? {}
      delete row.data

      row.hasPassword = !!row.password
      if (!includePassword) delete row.password

      row.dateCreated = parseInt(row.dateCreated, 10) // v1.0 schema used 'text' column

      result.push(row.roomId)
      entities[row.roomId] = row
    })

    return { result, entities }
  }

  static async set (roomId, room) {
    const { name, password, status, prefs } = room
    let query

    if (!name || !name.trim() || name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) {
      throw new ValidationError(`Room name must have ${NAME_MIN_LENGTH}-${NAME_MAX_LENGTH} characters`)
    }

    if (password && password.length < PASSWORD_MIN_LENGTH) {
      throw new ValidationError(`Room password must have at least ${PASSWORD_MIN_LENGTH} characters`)
    }

    if (!status || !STATUSES.includes(status)) {
      throw new ValidationError('Invalid room status')
    }

    if (typeof roomId === 'number') {
      const passwordSql = typeof password === 'undefined'
        // leave unchanged
        ? sql``
        // empty string unsets password
        : sql`password = ${password === '' ? null : await bcrypt.hash(password, BCRYPT_ROUNDS)},`

      query = sql`
        UPDATE rooms
        SET name = ${name},
            ${passwordSql}
            status = ${status},
            data = json_set(data, '$.prefs', json(${JSON.stringify(prefs)}))
        WHERE roomId = ${roomId}
      `
    } else {
      query = sql`
        INSERT INTO rooms (name, password, status, dateCreated, data)
        VALUES (
          ${name},
          ${typeof password === 'undefined' ? null : await bcrypt.hash(password, BCRYPT_ROUNDS)},
          ${status},
          ${Math.floor(Date.now() / 1000)},
          json_set('{}', '$.prefs', json(${JSON.stringify(prefs)}))
        )
      `
    }

    return await db.run(String(query), query.parameters)
  }

  /**
   * Validate a room against optional criteria
   *
   * @param  {Number}    roomId
   * @param  {[String]}  password      Room password
   * @param  {[Object]}  opts          (bool) isOpen, (bool) validatePassword
   * @return {Promise}                 True if validated, otherwise throws an error
   */
  static async validate (roomId, password,
    {
      isOpen = true,
      validatePassword = true,
      role,
    }: {
      isOpen?: boolean
      validatePassword?: boolean
      role?: any
    } = {},
  ) {
    const res = await Rooms.get(roomId, { includePassword: true })
    const room = res.entities[roomId]

    if (!room) {
      throw new Error('Room not found')
    }

    if (isOpen && room.status !== 'open') {
      throw new Error('Room is no longer open')
    }

    if (validatePassword && room.password) {
      if (!password) {
        throw new Error('Room password is required')
      }

      if (!(await bcrypt.compare(password, room.password))) {
        throw new Error('Incorrect room password')
      }
    }

    if (role) {
      const query = sql`SELECT roleId FROM roles WHERE name = ${role}`
      const row = await db.get(String(query), query.parameters)
      const roleId = row?.roleId

      if (!roleId) {
        throw new Error('Role not found')
      }

      if (!room.prefs?.roles?.[roleId]?.allowNew) {
        throw new Error(`New "${role}" accounts are not allowed in this room`)
      }
    }

    return true
  }

  static prefix (roomId: string | number = '') {
    return `ROOM_ID_${roomId}`
  }

  /**
   * Utility method to list active rooms on a socket.io instance
   *
   * @param  {Object}  io  The socket.io instance
   * @return {Array}       Array of objects as { room, roomId }
   */
  static getActive (io) {
    const rooms = []

    for (const room of io.sockets.adapter.rooms.keys()) {
      // ignore auto-generated per-user rooms
      if (room.startsWith(Rooms.prefix())) {
        const roomId = parseInt(room.substring(Rooms.prefix().length), 10)
        rooms.push({ room, roomId })
      }
    }

    return rooms
  }

  /**
   * Utility method to determine if a player is in a room
   *
   * @param  {Object}  io  The socket.io instance
   * @param  {Object}  roomId  Room to check
   * @return {Boolean}
   */
  static isPlayerPresent (io, roomId) {
    for (const sock of io.of('/').sockets.values()) {
      if (sock.user && sock.user.roomId === roomId && sock._lastPlayerStatus) {
        return true
      }
    }

    return false
  }

  /**
   * Remember that a user has been in a room
   *
   * @param  {Number}  roomId
   * @param  {Number}  userId
   */
  static trackUser (roomId: number, userId: number) {
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Set())
    }

    roomUsers.get(roomId)!.add(userId)
  }

  /**
   * Check if a user has been in a room (since server start)
   *
   * @param  {Number}  roomId
   * @param  {Number}  userId
   * @return {Boolean}
   */
  static hasUserBeenInRoom (roomId: number, userId: number): boolean {
    return roomUsers.get(roomId)?.has(userId) ?? false
  }

  /**
   * Create an ephemeral room for a user
   *
   * @param  {Number}  userId   Owner's userId
   * @param  {String}  name     Room name (usually username)
   * @return {Promise}          The created room
   */
  static async createEphemeral (userId: number, name: string) {
    const now = Math.floor(Date.now() / 1000)
    const query = sql`
      INSERT INTO rooms (name, status, dateCreated, ownerId, lastActivity, data)
      VALUES (${name}, 'open', ${now}, ${userId}, ${now}, '{}')
    `
    const res = await db.run(String(query), query.parameters)
    return res.lastID
  }

  /**
   * Get a room by its owner's userId
   *
   * @param  {Number}  userId
   * @return {Promise}
   */
  static async getByOwnerId (userId: number) {
    const query = sql`SELECT * FROM rooms WHERE ownerId = ${userId}`
    return await db.get(String(query), query.parameters)
  }

  /**
   * Get a room by name
   *
   * @param  {String}  name
   * @return {Promise}
   */
  static async getByName (name: string) {
    const query = sql`SELECT * FROM rooms WHERE name = ${name} COLLATE NOCASE`
    return await db.get(String(query), query.parameters)
  }

  /**
   * Update last activity timestamp for a room
   *
   * @param  {Number}  roomId
   * @return {Promise}
   */
  static async updateActivity (roomId: number) {
    const now = Math.floor(Date.now() / 1000)
    const query = sql`UPDATE rooms SET lastActivity = ${now} WHERE roomId = ${roomId}`
    return await db.run(String(query), query.parameters)
  }

  /**
   * Delete a room and its queue
   *
   * @param  {Number}  roomId
   * @return {Promise}
   */
  static async delete (roomId: number) {
    // Delete queue first
    const queueQuery = sql`DELETE FROM queue WHERE roomId = ${roomId}`
    await db.run(String(queueQuery), queueQuery.parameters)

    // Delete room
    const roomQuery = sql`DELETE FROM rooms WHERE roomId = ${roomId}`
    await db.run(String(roomQuery), roomQuery.parameters)

    // Clean up memory tracking
    roomUsers.delete(roomId)
  }

  /**
   * Get all ephemeral rooms that have been idle beyond the timeout
   *
   * @param  {Number}  timeoutMs  Idle timeout in milliseconds
   * @return {Promise}            Array of idle rooms
   */
  static async getIdleEphemeral (timeoutMs: number = IDLE_TIMEOUT_MS) {
    const cutoff = Math.floor((Date.now() - timeoutMs) / 1000)
    const query = sql`
      SELECT * FROM rooms
      WHERE ownerId IS NOT NULL
        AND lastActivity < ${cutoff}
    `
    return await db.all(String(query), query.parameters)
  }

  /**
   * Check if a room is ephemeral (has an owner)
   *
   * @param  {Number}  roomId
   * @return {Promise}
   */
  static async isEphemeral (roomId: number): Promise<boolean> {
    const query = sql`SELECT ownerId FROM rooms WHERE roomId = ${roomId}`
    const row = await db.get(String(query), query.parameters)
    return row?.ownerId !== null && row?.ownerId !== undefined
  }
}

export default Rooms
