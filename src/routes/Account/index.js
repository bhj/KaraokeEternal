import AccountViewContainer from './views/AccountViewContainer'

// route definition
export default function (store) {
  return {
    path: 'account',
    getComponent (nextState, cb) {
      cb(null, AccountViewContainer)
    }
  }
}
