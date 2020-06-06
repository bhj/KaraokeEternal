import { injectReducer } from 'store/reducers'
import { browserHistory } from 'react-router'

export default (store) => ({
  path : 'player',
  /*  Async getComponent is only invoked when route matches   */
  getComponent (nextState, cb) {
    if (!store.getState().user.isAdmin) {
      return browserHistory.push('/account')
    }

    /*  Webpack - use 'require.ensure' to create a split point
        and embed an async module loader (jsonp) when bundling   */
    require.ensure([], (require) => {
      /*  Webpack - use require callback to define
          dependencies for bundling   */
      const PlayerView = require('./views/PlayerViewContainer').default
      const playerReducer = require('./modules/player').default
      const playerVisualizerReducer = require('./modules/playerVisualizer').default

      /*  Add the reducer to the store on key 'player'  */
      injectReducer(store, { key: 'player', reducer: playerReducer })
      injectReducer(store, { key: 'playerVisualizer', reducer: playerVisualizerReducer })

      /*  Return getComponent   */
      cb(null, PlayerView)

    /* Webpack named bundle   */
    }, 'player')
  }
})
