import { injectReducer } from '../../store/reducers'
import requireAuth from 'components/requireAuth'
import PlayerContainer from './containers/PlayerContainer'

export default (store) => ({
  path : 'player',
  /*  Async getComponent is only invoked when route matches   */
  getComponent (nextState, cb) {
    /*  Webpack - use 'require.ensure' to create a split point
        and embed an async module loader (jsonp) when bundling   */
    require.ensure([], (require) => {
      /*  Webpack - use require callback to define
          dependencies for bundling   */
      const PlayerContainer = require('./containers/PlayerContainer').default
      const reducer = require('./modules/player').default

      /*  Add the reducer to the store on key 'player'  */
      injectReducer(store, { key: 'player', reducer })

      /*  Return getComponent   */
      cb(null, PlayerContainer)

    /* Webpack named bundle   */
    }, 'player')
  }
})
