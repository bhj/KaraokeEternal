import { injectReducer } from '../../store/reducers'
// import { requireAuth } from 'components/requireAuth'
import { fetchArtists } from './modules/library'
import SongsRoute from './routes/Songs'

export default (store) => ({
  path: 'library',
  childRoutes: [
    SongsRoute(store)
  ],
  getComponent (nextState, cb) {
    /*  Webpack - use 'require.ensure' to create a split point
        and embed an async module loader (jsonp) when bundling   */
    require.ensure([], (require) => {
      /*  Webpack - use require callback to define
          dependencies for bundling   */
      const Library = require('./containers/LibraryContainer').default

      if (!store.getState().library) {
        /*  Add the reducer to the store on key 'library'  */
        const reducer = require('./modules/library').default
        injectReducer(store, { key: 'library', reducer })
        store.dispatch(fetchArtists())
      }

      // @todo: no requireAuth() because it forces everything to be
      // re-mounted every time this route is hit... move it elsewhere
      cb(null, Library)

    /* Webpack named bundle   */
  }, 'library')
  }
})
