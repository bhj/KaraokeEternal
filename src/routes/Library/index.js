import LibraryContainer from './views/LibraryContainer'

export default (store) => ({
  path: 'library',
  getComponent (nextState, cb) {
    cb(null, LibraryContainer)
  },
})
