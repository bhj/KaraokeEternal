import LibraryViewContainer from './views/LibraryViewContainer'

export default (store) => ({
  path: 'library',
  getComponent (nextState, cb) {
    cb(null, LibraryViewContainer)
  },
})
