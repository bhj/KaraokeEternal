const db = require('sqlite')
const squel = require('squel')
const KoaRouter = require('koa-router')
const router = KoaRouter({ prefix: '/api' })
const debug = require('debug')
const log = debug('app:rooms')

// list available rooms
router.get('/rooms', async (ctx, next) => {
  try {
    ctx.body = await getRooms(ctx)
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
  }
})

// create room
router.post('/rooms', async (ctx, next) => {
  const room = ctx.request.body

  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  // sanity checks
  if (typeof room !== 'object' || !room.name || !room.status) {
    ctx.status = 422
    ctx.body = `Invalid room data`
    return
  }

  // do insert
  try {
    const q = squel.insert()
      .into('rooms')

    Object.keys(room).forEach(key => {
      q.set(key, room[key])
    })

    q.set('dateCreated', Math.floor(Date.now() / 1000))

    const { text, values } = q.toParam()
    const res = await db.run(text, values)

    if (res.stmt.changes) {
      log('%s created room "%s" (roomId: %s)', ctx.user.name, room.name, res.stmt.lastID)
    }
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
    return
  }

  // send updated room list
  try {
    ctx.body = await getRooms(ctx)
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
  }
})

// update room
router.put('/rooms/:roomId', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  // required
  if (!ctx.params.roomId || typeof ctx.request.body !== 'object') {
    ctx.status = 422
    ctx.body = `Invalid roomId or data`
    return
  }

  // update db
  try {
    const q = squel.update()
      .table('rooms')
      .where('roomId = ?', ctx.params.roomId)

    Object.keys(ctx.request.body).forEach(key => {
      q.set(key, ctx.request.body[key])
    })

    const { text, values } = q.toParam()
    const res = await db.run(text, values)

    if (res.stmt.changes) {
      log('%s updated roomId %s', ctx.user.name, ctx.params.roomId)
    }
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
    return
  }

  // send updated room list
  try {
    ctx.body = await getRooms(ctx)
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
  }
})

// remove room
router.delete('/rooms/:roomId', async (ctx, next) => {
  // must be admin
  if (!ctx.user.isAdmin) {
    ctx.status = 401
    return
  }

  // required
  if (!ctx.params.roomId) {
    ctx.status = 422
    ctx.body = `Invalid roomId`
    return
  }

  // delete row
  try {
    const q = squel.delete()
      .from('rooms')
      .where('roomId = ?', ctx.params.roomId)

    const { text, values } = q.toParam()
    const res = await db.run(text, values)

    if (res.stmt.changes) {
      log('%s deleted roomId %s', ctx.user.name, ctx.params.roomId)
    }
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
    return
  }

  // send updated room list
  try {
    ctx.body = await getRooms(ctx)
  } catch (err) {
    ctx.status = 500
    ctx.body = err.message
  }
})

module.exports = router

async function getRooms (ctx) {
  const result = []
  const entities = {}
  let res

  try {
    const q = squel.select()
      .from('rooms')

    if (!ctx.user.isAdmin) {
      q.where('status = ?', 'open')
    }

    const { text, values } = q.toParam()
    res = await db.all(text, values)
  } catch (err) {
    log(err)
    ctx.status = 500
    return
  }

  res.forEach(row => {
    const room = ctx.io.sockets.adapter.rooms[row.roomId]
    result.push(row.roomId)

    row.numUsers = room ? room.length : 0
    row.dateCreated = row.dateCreated.substr(0, 10)
    entities[row.roomId] = row
  })

  return { result, entities }
}
