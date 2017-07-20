import AccountViewContainer from './views/AccountViewContainer'
import { fetchPrefs } from 'store/modules/prefs'

// route definition
export default function (store) {
  return {
    path: 'account',
    getComponent (nextState, cb) {
      // Prefs component fetches prefs when it mounts, but we
      // need to do it here too to detect the firstRun flag
      store.dispatch(fetchPrefs())

      cb(null, AccountViewContainer)
    }
  }
}
