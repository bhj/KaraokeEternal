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

  let uids = []
  let songs = {}

  // get songs
  let rows = await ctx.db.all('SELECT queues.*, songs.title FROM queues JOIN songs USING (uid) WHERE roomId = ? ORDER BY queues.date', [roomId])

  rows.forEach(function(row){
    uids.push(row.uid)
    songs[row.uid] = row
  })

  ctx.body = {result: uids, entities: {songs}}
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
  let now = new Date()
  let res = await ctx.db.run('INSERT INTO queues (roomId, userId, uid, date) VALUES (?, ?, ?, ?)',
    [roomId, ctx.state.user.id, ctx.params.uid, now])

  return ctx.status = (res.changes === 1) ? 200 : 500
})

export default router
