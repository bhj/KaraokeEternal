import LibraryContainer from './containers/LibraryContainer'

export default (store) => ({
  path: 'library',
  getComponent (nextState, cb) {
    cb(null, LibraryContainer)
  },
})
