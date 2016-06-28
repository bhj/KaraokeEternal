import _debug from 'debug'
const debug = _debug('app:server')

async function queueActions(ctx, next) {
  const { type, payload } = ctx.data

  switch(type) {
    case 'server/NOTIFY_QUEUE_CHANGE':
      try {
        let roomId = payload

        ctx.io.in(roomId)
        ctx.io.emit('action', {
          type: 'queue/QUEUE_CHANGE',
          payload: await _fetchQueue(ctx.db, roomId)
        })
      } catch(err) {
        debug(err)
      }
      break
    case 'server/JOIN_ROOM':
      try {
        let roomId = payload
        let socketId = ctx.socket.socket.id // raw socket.io instance

        ctx.socket.socket.join(roomId)

        // emit queue only to the newcomer
        ctx.io.to(socketId)
        ctx.io.emit('action', {
          type: 'queue/QUEUE_CHANGE',
          payload: await _fetchQueue(ctx.db, roomId)
        })

        debug('client %s joined room %s (%s in room)', socketId, roomId, ctx.socket.socket.adapter.rooms[roomId].length)
      } catch(err) {
        debug(err)
      }
      break
    case 'server/LEAVE_ROOM':
      let roomId = payload
      let socketId = ctx.socket.socket.id // raw socket.io instance

      ctx.socket.socket.leave(roomId)
      debug('client %s left room %s (%s in room)', socketId, roomId, ctx.socket.socket.adapter.rooms[roomId].length)
      break
    default : debug('unknown action type: ', type)
  }

  await next()
}

export default queueActions


async function _fetchQueue(db, roomId) {
  let queueIds = []
  let items = {}

  // get songs
  let rows = await db.all('SELECT queue.*, songs.provider, users.name AS userName FROM queue JOIN songs on queue.songUID = songs.uid LEFT OUTER JOIN users ON queue.userId = users.id WHERE roomId = ? ORDER BY date', [roomId])

  rows.forEach(function(row){
    queueIds.push(row.id)
    items[row.id] = row
  })

  return {result: queueIds, entities: items}
}
