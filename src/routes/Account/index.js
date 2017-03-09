import AccountView from './containers/AccountView'
import { fetchRooms } from 'store/modules/user'

// route definition
export default function(store){
  return {
    path: 'account',
    getComponent (nextState, cb) {
      store.dispatch(fetchRooms())
      cb(null, AccountView)
    }
  }
}
