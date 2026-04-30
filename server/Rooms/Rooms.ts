import crypto from '../lib/crypto.js'
import sql from 'sqlate'
import { db } from '../lib/Database.js'
import { ValidationError } from '../lib/Errors.js'

const NAME_MIN_LENGTH = 1
const NAME_MAX_LENGTH = 50
const PASSWORD_MIN_LENGTH = 5

export const STATUSES = ['open', 'closed']

// Remember which users have been seen in each room
const roomUsers: Map<number, Set<number>> = new Map()

class Rooms {
  /**
   * Get all rooms
   */
  static get (
    roomId: number | null | undefined = undefined,
    { status = ['open'], includePassword = false }: { status?: string[], includePassword?: boolean } = {},
  ): { result: number[], entities: Record<number, any> } {
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
    const res = db.all<{
      roomId: number
      name: string // assuming name exists
      status: string // assuming status exists
      data: string
      password?: string | null
      dateCreated: string | number
      prefs?: any
      hasPassword?: boolean
      managers?: number[]
    }>(String(query), query.parameters)

    res.forEach((row) => {
      const data = JSON.parse(row.data)
      row.prefs = data.prefs ?? {}
      delete row.data

      row.hasPassword = !!row.password
      if (!includePassword) delete row.password

      row.dateCreated = parseInt(String(row.dateCreated), 10) // v1.0 schema used 'text' column
      row.managers = []

      result.push(row.roomId)
      entities[row.roomId] = row
    })

    if (result.length > 0) {
      const mgrQuery = sql`
        SELECT roomId, userId
        FROM roomManagers
        WHERE roomId IN ${sql.tuple(result)}
      `
      const mgrRows = db.all<{ roomId: number, userId: number }>(String(mgrQuery), mgrQuery.parameters)
      for (const r of mgrRows) {
        entities[r.roomId].managers.push(r.userId)
      }
    }

    return { result, entities }
  }

  /**
   * Get manager userIds for a room
   */
  static getManagers (roomId: number): number[] {
    const query = sql`
      SELECT userId
      FROM roomManagers
      WHERE roomId = ${roomId}
      ORDER BY userId ASC
    `
    return db.all<{ userId: number }>(String(query), query.parameters).map(r => r.userId)
  }

  /**
   * Replace the manager set for a room
   */
  static setManagers (roomId: number, userIds: number[]): void {
    if (!Array.isArray(userIds)) {
      throw new ValidationError('managers must be an array of userIds')
    }

    const cleaned: number[] = []
    for (const id of userIds) {
      const n = typeof id === 'number' ? id : parseInt(String(id), 10)
      if (!Number.isInteger(n) || n <= 0) {
        throw new ValidationError('managers contains an invalid userId')
      }
      if (!cleaned.includes(n)) cleaned.push(n)
    }

    if (cleaned.length > 0) {
      // verify all userIds exist and have role 'room_manager'
      const verifyQuery = sql`
        SELECT users.userId
        FROM users
          INNER JOIN roles USING (roleId)
        WHERE roles.name = 'room_manager' AND users.userId IN ${sql.tuple(cleaned)}
      `
      const found = db.all<{ userId: number }>(String(verifyQuery), verifyQuery.parameters).map(r => r.userId)
      const missing = cleaned.filter(id => !found.includes(id))
      if (missing.length > 0) {
        throw new ValidationError(`Cannot assign manager: user must have the room_manager role (userIds: ${missing.join(',')})`)
      }
    }

    db.exec('BEGIN')
    try {
      const delQuery = sql`DELETE FROM roomManagers WHERE roomId = ${roomId}`
      db.run(String(delQuery), delQuery.parameters)

      for (const userId of cleaned) {
        const insQuery = sql`
          INSERT INTO roomManagers (roomId, userId) VALUES (${roomId}, ${userId})
        `
        db.run(String(insQuery), insQuery.parameters)
      }
      db.exec('COMMIT')
    } catch (err) {
      db.exec('ROLLBACK')
      throw err
    }
  }

  /**
   * Whether a user manages a specific room
   */
  static isManager (roomId: number, userId: number): boolean {
    if (typeof roomId !== 'number' || typeof userId !== 'number') return false
    const query = sql`
      SELECT 1 AS one
      FROM roomManagers
      WHERE roomId = ${roomId} AND userId = ${userId}
      LIMIT 1
    `
    return !!db.get(String(query), query.parameters)
  }

  /**
   * List roomIds a user manages
   */
  static getManagedRoomIds (userId: number): number[] {
    if (typeof userId !== 'number') return []
    const query = sql`
      SELECT roomId
      FROM roomManagers
      WHERE userId = ${userId}
      ORDER BY roomId ASC
    `
    return db.all<{ roomId: number }>(String(query), query.parameters).map(r => r.roomId)
  }

  /**
   * Delete all queue rows for a room
   */
  static clearQueue (roomId: number): number {
    const query = sql`
      DELETE FROM queue
      WHERE roomId = ${roomId}
    `
    const res = db.run(String(query), query.parameters)
    return res.changes ?? 0
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
        : sql`password = ${password === '' ? null : await crypto.hash(password)},`

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
          ${typeof password === 'undefined' ? null : await crypto.hash(password)},
          ${status},
          ${Math.floor(Date.now() / 1000)},
          json_set('{}', '$.prefs', json(${JSON.stringify(prefs)}))
        )
      `
    }

    return db.run(String(query), query.parameters)
  }

  /**
   * Validate a room against optional criteria
   */
  static async validate (
    roomId: number,
    password: string | undefined,
    {
      isOpen = true,
      validatePassword = true,
      role,
    }: {
      isOpen?: boolean
      validatePassword?: boolean
      role?: any
    } = {},
  ): Promise<boolean> {
    const res = Rooms.get(roomId, { includePassword: true })
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

      if (!(await crypto.compare(password, room.password))) {
        throw new Error('Incorrect room password')
      }

      if (crypto.isLegacy(room.password)) {
        const newHash = await crypto.hash(password)
        const query = sql`
          UPDATE rooms
          SET password = ${newHash}
          WHERE roomId = ${roomId}
        `
        db.run(String(query), query.parameters)
      }
    }

    if (role) {
      const query = sql`SELECT roleId FROM roles WHERE name = ${role}`
      const row = db.get<{ roleId: number }>(String(query), query.parameters)
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
   */
  static getActive (io: any): { room: string, roomId: number }[] {
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
   */
  static isPlayerPresent (io: any, roomId: number): boolean {
    for (const sock of io.of('/').sockets.values()) {
      if (sock.user && sock.user.roomId === roomId && sock._lastPlayerStatus) {
        return true
      }
    }

    return false
  }

  /**
   * Remember that a user has been in a room
   */
  static trackUser (roomId: number, userId: number) {
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Set())
    }

    roomUsers.get(roomId)!.add(userId)
  }

  /**
   * Check if a user has been in a room (since server start)
   */
  static hasUserBeenInRoom (roomId: number, userId: number): boolean {
    return roomUsers.get(roomId)?.has(userId) ?? false
  }
}

export default Rooms
