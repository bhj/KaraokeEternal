import KoaRouter from 'koa-router'
let router = KoaRouter()

// get queue
router.get('/api/queue', async (ctx, next) => {
  // use roomId from their JWT
  if (!ctx.state.user) {
    ctx.status = 401
    return ctx.body = 'Invalid token (try signing in again)'
  }

  // verify room
  let roomId = ctx.state.user.roomId
  let room = await ctx.db.get('SELECT * FROM rooms WHERE id = ?', [roomId])

  if (!room || room.status !== 'open') {
    ctx.status = 401
    return ctx.body = 'Room is invalid or closed'
  }

  let queuedIds = []
  let items = {}

  // get songs
  let rows = await ctx.db.all('SELECT * FROM queue WHERE roomId = ? ORDER BY date', [roomId])

  rows.forEach(function(row){
    queuedIds.push(row.id)
    items[row.id] = row
  })

  ctx.body = {result: queuedIds, entities: items}
})

// queue song
router.put('/api/queue/:uid', async (ctx, next) => {
  // use roomId from their JWT
  if (!ctx.state.user) {
    ctx.status = 401
    return ctx.body = 'Invalid token (try signing in again)'
  }

  // verify room
  let roomId = ctx.state.user.roomId
  let room = await ctx.db.get('SELECT * FROM rooms WHERE id = ?', [roomId])

  if (!room || room.status !== 'open') {
    ctx.status = 401
    return ctx.body = 'Room is invalid or closed'
  }

  // verify song exists
  let song = await ctx.db.get('SELECT * FROM songs WHERE uid = ?', [ctx.params.uid])

  if (! song) {
    ctx.status = 404
    return ctx.body = 'UID not found'
  }

  // add to queue
  let res = await ctx.db.run('INSERT INTO queue (roomId, userId, songUID, date) VALUES (?, ?, ?, ?)',
    [roomId, ctx.state.user.id, ctx.params.uid, Date.now()])

  return ctx.status = (res.changes === 1) ? 200 : 500
})

export default router
