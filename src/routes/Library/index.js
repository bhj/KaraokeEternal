import LibraryViewContainer from './views/LibraryViewContainer'
import RequireAuth from 'components/RequireAuth'

export default (store) => ({
  path: 'library',
  getComponent (nextState, cb) {
    cb(null, RequireAuth(LibraryViewContainer))
  },
})
