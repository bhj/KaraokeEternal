const bcrypt = require('../lib/bcrypt')
const db = require('../lib/Database').db
const sql = require('sqlate')
const crypto = require('crypto');

class Rooms {
  /**
   * Get all rooms
   *
   * @param  {Boolean}  closed  Whether to include rooms with status "closed"
   * @return {Promise}
   */
  static async get (closed = false) {
    const result = []
    const entities = {}
    const whereClause = closed ? sql`true` : sql`status = "open"`

    const query = sql`
      SELECT * FROM rooms
      WHERE ${whereClause}
      ORDER BY dateCreated DESC
    `
    const res = await db.all(String(query), query.parameters)

    res.forEach(row => {
      row.dateCreated = row.dateCreated.substring(0, 10)
      row.hasPassword = !!row.password
      delete row.password

      result.push(row.roomId)
      entities[row.roomId] = row
    })

    return { result, entities }
  }

  /**
   * Find room
   *
   * @param  {Integer}  roomId  ID of room to fetch
   * @return {Promise}
   */
  static async getRoom (roomId) {
    let entity = {}
    const whereClause = sql`roomId = ${roomId}`

    const query = sql`
      SELECT * FROM rooms
      WHERE ${whereClause}
    `
    const row = await db.get(String(query), query.parameters)


    if (!row) {
      throw new Error('Room not found')
    }

    row.dateCreated = row.dateCreated.substring(0, 10)
    row.hasPassword = !!row.password

    row.token = this.generateToken(row)

    delete row.password

    entity = row


    return { entity }
  }

  static generateToken (room) {
    const secret = room.password;
    const payload = {
      id: room.id,
      status: room.status,
      name: room.name
    };
    const token = crypto.createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return token;
  } 

  static verifyToken (room, token) {
    const verifyToken = this.generateToken(room);

    return token === verifyToken;
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

      if (!await bcrypt.compare(password, room.password) && !this.verifyToken(room, password)) {
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

module.exports = Rooms
