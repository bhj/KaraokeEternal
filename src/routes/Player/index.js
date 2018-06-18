import { injectReducer } from '../../store/reducers'
import RequireAuth from 'components/RequireAuth'

export default (store) => ({
  path : 'player',
  /*  Async getComponent is only invoked when route matches   */
  getComponent (nextState, cb) {
    /*  Webpack - use 'require.ensure' to create a split point
        and embed an async module loader (jsonp) when bundling   */
    require.ensure([], (require) => {
      /*  Webpack - use require callback to define
          dependencies for bundling   */
      const PlayerView = require('./views/PlayerViewContainer').default
      const reducer = require('./modules/player').default

      /*  Add the reducer to the store on key 'player'  */
      injectReducer(store, { key: 'player', reducer })

      /*  Return getComponent   */
      cb(null, RequireAuth(PlayerView))

    /* Webpack named bundle   */
    }, 'player')
  }
})
