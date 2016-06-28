import KoaRouter from 'koa-router'
let router = KoaRouter()

// add to queue
router.put('/api/queue/:uid', async (ctx, next) => {
  if (!ctx.state.user) {
    ctx.status = 401
    return ctx.body = 'Invalid token (try signing in again)'
  }

  // use roomId from their JWT
  await isRoomOpen.call(ctx, ctx.state.user.roomId)

  // verify song exists
  let song = await ctx.db.get('SELECT * FROM songs WHERE uid = ?', [ctx.params.uid])

  if (! song) {
    ctx.status = 404
    return ctx.body = 'UID not found'
  }

  // insert row
  let res = await ctx.db.run('INSERT INTO queue (roomId, userId, songUID, date) VALUES (?, ?, ?, ?)',
    [ctx.state.user.roomId, ctx.state.user.id, ctx.params.uid, Date.now()])

  if (res.changes !== 1) {
    ctx.status = 500
    return ctx.body = 'Could not queue item'
  }

  return ctx.status = 200
})

// remove from queue
router.del('/api/queue/:id', async (ctx, next) => {
  if (!ctx.state.user) {
    ctx.status = 401
    return ctx.body = 'Invalid token (try signing in again)'
  }

  // verify item exists
  let item = await ctx.db.get('SELECT * FROM queue WHERE id = ?', [ctx.params.id])

  if (!item) {
    ctx.status = 404
    return ctx.body = 'Item not found'
  }

  // is it in the user's room?
  if (item.roomId !== ctx.state.user.roomId) {
    ctx.status = 401
    return ctx.body = 'Item is not in your room'
  }

  // is it the user's item?
  if (item.userId !== ctx.state.user.id) {
    ctx.status = 401
    return ctx.body = 'Item is NOT YOURS'
  }

  // use roomId from their JWT
  await isRoomOpen.call(ctx, ctx.state.user.roomId)

  // delete item
  let res = await ctx.db.run('DELETE FROM queue WHERE id = ?', [item.id])

  if (res.changes !== 1) {
    ctx.status = 500
    return ctx.body = 'Could not delete item'
  }

  return ctx.status = 200
})

export default router


async function isRoomOpen(roomId) {
  let room = await this.db.get('SELECT * FROM rooms WHERE id = ?', [roomId])

  if (!room || room.status !== 'open') {
    this.status = 401
    return this.body = 'Room is invalid or closed'
  }
}
