import { UserAuthWrapper } from 'redux-auth-wrapper'
import { routerActions } from 'react-router-redux'

// Redirects to /login by default
export const requireAuth = UserAuthWrapper({
  authSelector: state => state.account.user, // how to get the user state
  predicate: user => user !== null,
  failureRedirectPath: '/account',
  redirectAction: routerActions.replace, // the redux action to dispatch for redirect
  wrapperDisplayName: 'requireAuth' // a nice name for this auth check
})
