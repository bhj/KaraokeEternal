const db = require('sqlite')
const sql = require('sqlate')

class Rooms {
  /**
   * Get all rooms
   *
   * @param  {Boolean}  onlyOpen  Whether to restrict query to open rooms only
   * @return {Promise}
   */
  static async get (onlyOpen = true) {
    const result = []
    const entities = {}
    const whereClause = onlyOpen ? sql`status = "open"` : sql`true`

    const query = sql`
      SELECT * FROM rooms
      WHERE ${whereClause}
      ORDER BY dateCreated DESC
    `
    const res = await db.all(String(query), query.parameters)

    res.forEach(row => {
      result.push(row.roomId)
      row.dateCreated = row.dateCreated.substring(0, 10)
      entities[row.roomId] = row
    })

    return { result, entities }
  }

  /**
   * Check if a given roomId is open
   *
   * @param  {Number}  roomId
   * @return {Promise}
   */
  static async isRoomOpen (roomId) {
    const query = sql`
      SELECT * FROM rooms
      WHERE roomId = ${roomId}
    `
    const room = await db.get(String(query), query.parameters)

    return (room && room.status === 'open')
  }

  static prefix (roomId = '') {
    return `KF_ROOM_ID_${roomId}`
  }
}

module.exports = Rooms
