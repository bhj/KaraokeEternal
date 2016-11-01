// We only need to import the modules necessary for initial render
import {ensureState} from 'redux-optimistic-ui'
import CoreLayout from '../layouts/CoreLayout/CoreLayout'
import Home from './Home'
import AccountRoute from './Account'
import PlayerRoute from './Player'
import LibraryRoute from './Library'
import QueueRoute from './Queue'
import { fetchLibrary } from './Library/modules/library'

/*  Note: Instead of using JSX, we recommend using react-router
    PlainRoute objects to build route definitions.   */

export const createRoutes = (store) => ({
  path: '/',
  getComponent (nextState, cb) {
    const state = ensureState(store.getState())
    if (!state.library.artists.result.length) {
      store.dispatch(fetchLibrary())
    }

    cb(null, CoreLayout)
  },
  indexRoute: Home,
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
