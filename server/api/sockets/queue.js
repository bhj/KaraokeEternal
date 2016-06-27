import { getQueue } from '../routes/queue'

async function queueSocket(ctx, next) {
  const { type, payload } = ctx.data

  switch(type) {
    case 'server/NOTIFY_QUEUE_CHANGE':
      try {
        ctx.io.in(payload) // roomId
        ctx.io.emit('action', {type: 'queue/QUEUE_CHANGE', payload: await getQueue(ctx, payload)})
      } catch(err) {
        console.log(err)
      }
      break
    default : debug('unknown action type: ', type)
  }

  await next()
}

export default queueSocket
