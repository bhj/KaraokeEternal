import { injectReducer } from '../../store/reducers'
// import { requireAuth } from 'components/requireAuth'
import { fetchArtists } from './routes/Artists/modules/artists'
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

      // would prefer to let an Artists route dfn handle this initial
      // load, but we're bypassing the router so LibraryView can always
      // keep the artist list mounted regardless of subroute
      if (!store.getState().artists.entities) {
        store.dispatch(fetchArtists())
      }

      // @todo: no requireAuth() because it forces everything to be
      // re-mounted every time this route is hit... move it elsewhere
      cb(null, Library)

    /* Webpack named bundle   */
  }, 'library')
  }
})
