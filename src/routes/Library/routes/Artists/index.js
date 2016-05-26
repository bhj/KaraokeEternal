import { injectReducer } from 'store/reducers'

export default (store) => ({
  path: 'artists',
  /*  Async getComponent is only invoked when route matches   */
  getComponent (nextState, cb) {
    /*  Webpack - use 'require.ensure' to create a split point
        and embed an async module loader (jsonp) when bundling   */
    require.ensure([], (require) => {
      /*  Webpack - use require callback to define
          dependencies for bundling   */
      const Artists = require('./containers/ArtistsContainer').default
      const reducer = require('./modules/artists').default

      /*  Add the reducer to the store on key 'counter'  */
      injectReducer(store, { key: 'artists', reducer })

      /*  Return getComponent   */
      cb(null, Artists)

    /* Webpack named bundle   */
  }, 'artists')
  }
})
