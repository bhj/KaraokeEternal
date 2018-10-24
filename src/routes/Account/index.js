import AccountViewContainer from './views/AccountViewContainer'
import { fetchPrefs } from 'store/modules/prefs'

// route definition
export default function (store) {
  return {
    path: 'account',
    getComponent (nextState, cb) {
      // do this here instead of Prefs component to detect firstRun
      store.dispatch(fetchPrefs())

      cb(null, AccountViewContainer)
    }
  }
}
