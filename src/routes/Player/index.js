import PlayerContainer from './containers/PlayerContainer'
import requireAuth from 'components/requireAuth'

export default (store) => ({
  path: 'player',
  getComponent (nextState, cb) {
    cb(null, requireAuth(PlayerContainer))
  }
})
