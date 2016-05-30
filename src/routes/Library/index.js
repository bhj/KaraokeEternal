import { injectReducer } from '../../store/reducers'
import { requireAuth } from 'components/requireAuth'
import { fetchArtists } from './modules/library'
import ArtistsContainer from './routes/Artists/containers/ArtistsContainer'
import SongsRoute from './routes/Songs'

export default (store) => ({
  path: 'library',
  indexRoute: {component: ArtistsContainer},
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
      const reducer = require('./modules/library').default

      /*  Add the reducer to the store on key 'library'  */
      injectReducer(store, { key: 'library', reducer })

      store.dispatch(fetchArtists())

      /*  Return getComponent   */
      cb(null, requireAuth(Library))

    /* Webpack named bundle   */
  }, 'library')
  }
})
