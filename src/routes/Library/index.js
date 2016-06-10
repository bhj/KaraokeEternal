import SearchRoute from './routes/Search'

export default (store) => ({
  path: 'library',
  childRoutes: [
    SearchRoute(store)
  ]
})
