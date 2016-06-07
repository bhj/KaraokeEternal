import { injectReducer } from '../../store/reducers'
// import { requireAuth } from 'components/requireAuth'
import { fetchLibrary } from './modules/library'
import SearchRoute from './routes/Search'

export default (store) => ({
  path: 'library',
  childRoutes: [
    SearchRoute(store)
  ],
  getComponent (nextState, cb) {
    /*  Webpack - use 'require.ensure' to create a split point
        and embed an async module loader (jsonp) when bundling   */
    require.ensure([], (require) => {
      /*  Webpack - use require callback to define
          dependencies for bundling   */
      const Library = require('./containers/LibraryContainer').default
      const reducer = require('./modules/library').default

      /*  Add the reducer to the store on key 'counter'  */
      injectReducer(store, { key: 'library', reducer })

      // would prefer to let an Artists route dfn handle this initial
      // load, but we're bypassing the router so LibraryView can always
      // keep the artist list mounted regardless of subroute
      if (!store.getState().library.result.length) {
        store.dispatch(fetchLibrary())
      }

      // @todo: no requireAuth() because it forces everything to be
      // re-mounted every time this route is hit... move it elsewhere
      cb(null, Library)

    /* Webpack named bundle   */
  }, 'library')
  }
})
