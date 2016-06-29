const QUEUE_UPDATE = 'server/QUEUE_UPDATE'
export const QUEUE_UPDATE_SUCCESS = 'server/QUEUE_UPDATE_SUCCESS'

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
}

export default async function queueActions(ctx, next) {
  const action = ctx.data
  const handler = ACTION_HANDLERS[action.type]

  if (handler) await handler(ctx, action)

  await next()
}


export async function fetchQueue(db, roomId) {
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
