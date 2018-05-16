import CoreLayout from 'layouts/CoreLayout'
import AccountRoute from './Account'
import PlayerRoute from './Player'
import LibraryRoute from './Library'
import QueueRoute from './Queue'

export const createRoutes = (store) => ({
  path: '/',
  getComponent (nextState, cb) {
    cb(null, CoreLayout)
  },
  indexRoute: { onEnter: (nextState, replace) => replace('/library') },
  childRoutes: [
    AccountRoute(store),
    PlayerRoute(store),
    LibraryRoute(store),
    QueueRoute(store)
  ]
})

/*  Note: childRoutes can be chunked or otherwise loaded programmatically
    using getChildRoutes with the following signature:

    getChildRoutes (location, cb) {
      require.ensure([], (require) => {
        cb(null, [
          // Remove imports!
          require('./Counter').default(store)
        ])
      })
    }

    However, this is not necessary for code-splitting! It simply provides
    an API for async route definitions. Your code splitting should occur
    inside the route `getComponent` function, since it is only invoked
    when the route exists and matches.
*/

export default createRoutes
