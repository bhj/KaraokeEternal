import QueueViewContainer from './views/QueueViewContainer'
import RequireAuth from 'components/RequireAuth'

// route definition
export default function (store) {
  return {
    path: 'queue',
    getComponent (nextState, cb) {
      cb(null, RequireAuth(QueueViewContainer))
    }
  }
}
