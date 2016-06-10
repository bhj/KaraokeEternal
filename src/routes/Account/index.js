import AccountContainer from './containers/AccountContainer'
import { fetchRooms } from './modules/account'

// route definition
export default function(store){
  return {
    path: 'account',
    getComponent (nextState, cb) {
      store.dispatch(fetchRooms())
      cb(null, AccountContainer)
    }
  }
}
