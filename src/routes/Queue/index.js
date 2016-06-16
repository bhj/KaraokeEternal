import { requireAuth } from 'components/requireAuth'
import QueueContainer from './containers/QueueContainer'
import { fetchQueue } from './modules/queue'

// route definition
export default function(store){
  return {
    path: 'queue',
    getComponent (nextState, cb) {
      if (!store.getState().queue.result.length && store.getState().account.user) {
        store.dispatch(fetchQueue(store.getState().account.user.roomId))
      }

      cb(null, requireAuth(QueueContainer))
    }
  }
}
