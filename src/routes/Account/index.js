import AccountContainer from './containers/AccountContainer'

// Sync route definition
export default function(store){
  return {
    path: 'account',
    component: AccountContainer
  }
}
