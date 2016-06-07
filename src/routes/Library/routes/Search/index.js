import SearchView from './components/SearchView'

export default (store) => ({
  path: 'search',
  getComponent (nextState, cb) {
    require.ensure([], (require) => {
      // const SongsContainer = require('./containers/SongsContainer').default
      // store.dispatch(fetchSongs(nextState.params.artistId))
      cb(null, SearchView)
    })
  }
})
