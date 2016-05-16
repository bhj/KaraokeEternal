import AccountView from './components/AccountView'

// Sync route definition
export default function(store){
  return {
    path: 'account',
    component: AccountView
  }
}
