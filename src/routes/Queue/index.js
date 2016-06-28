import QueueContainer from './containers/QueueContainer'
import { requireAuth } from 'components/requireAuth'

// route definition
export default function(store){
  return {
    path: 'queue',
    getComponent (nextState, cb) {
      cb(null, requireAuth(QueueContainer))
    }
  }
}
