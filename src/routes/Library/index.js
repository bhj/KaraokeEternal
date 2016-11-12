import LibraryContainer from './containers/LibraryContainer'
import SearchRoute from './routes/Search'

export default (store) => ({
  path: 'library',
  getComponent (nextState, cb) {
    cb(null, LibraryContainer)
  },
  childRoutes: [
    SearchRoute(store)
  ]
})
