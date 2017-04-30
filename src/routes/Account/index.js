import AccountView from './containers/AccountView'
import { fetchRooms } from 'store/modules/user'
import { fetchPrefs } from 'store/modules/prefs'

// route definition
export default function (store) {
  return {
    path: 'account',
    getComponent (nextState, cb) {
      store.dispatch(fetchRooms())
      store.dispatch(fetchPrefs())

      cb(null, AccountView)
    }
  }
}
