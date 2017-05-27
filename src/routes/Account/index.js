import AccountContainer from './views/AccountContainer'
import { fetchRooms } from 'store/modules/room'
import { fetchPrefs } from 'store/modules/prefs'

// route definition
export default function (store) {
  return {
    path: 'account',
    getComponent (nextState, cb) {
      store.dispatch(fetchRooms())
      store.dispatch(fetchPrefs())

      cb(null, AccountContainer)
    }
  }
}
