import bcrypt from '../lib/bcrypt.js'
import sql from 'sqlate'
import Database from '../lib/Database.js'
import { ValidationError } from '../lib/Errors.js'

const { db } = Database
const BCRYPT_ROUNDS = 12
const NAME_MIN_LENGTH = 1
const NAME_MAX_LENGTH = 50
const PASSWORD_MIN_LENGTH = 5

export const STATUSES = ['open', 'closed']

class Rooms {
  /**
   * Get all rooms
   *
   * @param  {Object}
   * @return {Promise}
   */
  static async get (roomId, { status = ['open'], prefs = false }) {
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
      SELECT * FROM rooms
      ${whereClause}
      ORDER BY dateCreated DESC
    `
    const res = await db.all(String(query), query.parameters)

    res.forEach((row) => {
      row.dateCreated = parseInt(row.dateCreated, 10) // v1.0 schema used 'text' column
      row.hasPassword = !!row.password

      if (prefs) {
        const data = JSON.parse(row.data)
        row.prefs = data.prefs ?? {}
      }

      delete row.password
      delete row.data

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
  static async validate (roomId, password, { isOpen = true, validatePassword = true } = {}) {
    const query = sql`
      SELECT * FROM rooms
      WHERE roomId = ${roomId}
    `
    const room = await db.get(String(query), query.parameters)

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

    return true
  }

  static prefix (roomId = '') {
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
}

export default Rooms
