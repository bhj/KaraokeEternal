const db = require('sqlite')
const sql = require('sqlate')

class Rooms {
  /**
   * Get all rooms
   *
   * @param  {Object}  ctx  Koa request context
   * @return {Promise}
   */
  static async get (ctx) {
    const result = []
    const entities = {}

    // only admins can see non-open rooms
    const whereClause = !ctx.user.isAdmin ? sql`status = "open"` : sql`true`

    const query = sql`
      SELECT * FROM rooms
      WHERE ${whereClause}
      ORDER BY dateCreated DESC
    `
    const res = await db.all(String(query), query.parameters)

    res.forEach(row => {
      const room = ctx.io.sockets.adapter.rooms[row.roomId]
      result.push(row.roomId)

      row.numUsers = room ? room.length : 0
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
}

module.exports = Rooms
