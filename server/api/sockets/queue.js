const QUEUE_UPDATE = 'server/QUEUE_UPDATE'
export const QUEUE_UPDATE_SUCCESS = 'server/QUEUE_UPDATE_SUCCESS'

// const PLAY_NEXT = 'server/PLAY_NEXT' // to server
// const PLAY_NEXT_SUCCESS = 'server/PLAY_NEXT_SUCCESS' // from server

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [QUEUE_UPDATE]: async (ctx, {payload}) => {
    let roomId = payload

    ctx.io.to(roomId).emit('action', {
      type: QUEUE_UPDATE_SUCCESS,
      payload: await fetchQueue(ctx.db, roomId)
    })
  },
  // [PLAY_NEXT]: async (ctx, {payload}) => {
  //   const { curItemId, roomId } = payload
  //
  //   // get next highest id in the queue
  //   let row =
  //
  //   ctx.io.to(roomId).emit('action', {
  //     type: PLAY_NEXT_SUCCESS,
  //     payload: await fetchQueue(ctx.db, roomId)
  //   })
  // },
}

export default async function queueActions(ctx, next) {
  const action = ctx.data
  const handler = ACTION_HANDLERS[action.type]

  if (handler) await handler(ctx, action)

  // next koa-socket middleware
  await next()
}


export async function fetchQueue(db, roomId) {
  let queueIds = []
  let uids = []
  let items = {}

  // get songs
  let rows = await db.all('SELECT queue.*, songs.provider, users.name AS userName FROM queue JOIN songs on queue.uid = songs.uid LEFT OUTER JOIN users ON queue.userId = users.id WHERE roomId = ? ORDER BY date', [roomId])

  rows.forEach(function(row){
    queueIds.push(row.queueId)
    items[row.queueId] = row

    // used for quick lookup by Library
    uids.push(row.uid)
  })

  return {result: {uids, queueIds}, entities: items}
}
