import { injectReducer } from '../../store/reducers'
import { requireAuth } from 'components/requireAuth'

export default (store) => ({
  /*  Async getComponent is only invoked when route matches   */
  path: 'player',
  getComponent (nextState, cb) {
    require.ensure([], (require) => {
      const Player = require('./containers/PlayerContainer').default
      const reducer = require('./modules/player').default

      injectReducer(store, { key: 'player', reducer })

      /*  Return getComponent   */
      cb(null, requireAuth(Player))

    /* Webpack named bundle   */
  }, 'player')
  }
})
