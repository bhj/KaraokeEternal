import { fetchSongs } from './modules/songs'
import SongsContainer from './containers/SongsContainer'

export default (store) => ({
  path: 'artist/:artistId',
  getComponent (nextState, cb) {
    require.ensure([], (require) => {
      const SongsContainer = require('./containers/SongsContainer').default
      store.dispatch(fetchSongs(nextState.params.artistId))
      cb(null, SongsContainer)
    })
  }
})
