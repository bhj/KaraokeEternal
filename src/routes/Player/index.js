import { requireAuth } from 'components/requireAuth'
import Player from './containers/PlayerContainer'

export default (store) => ({
  path: 'player',
  /*  Async getComponent is only invoked when route matches   */
  getComponent (nextState, cb) {
      cb(null, requireAuth(Player))
  }
})
