import { UserAuthWrapper } from 'redux-auth-wrapper'
import {ensureState} from 'redux-optimistic-ui'
import { browserHistory } from 'react-router'

// Redirects to /login by default
export const requireAuth = UserAuthWrapper({
  authSelector: state => { ensureState(state).account.user }, // how to get the user state
  predicate: user => user !== null,
  failureRedirectPath: '/account',
  wrapperDisplayName: 'requireAuth', // a nice name for this auth check
  redirectAction: (newLoc) => (dispatch) => {
     browserHistory.push(newLoc)
     // dispatch(addNotification({ message: 'Sorry, you are not an administrator' }));
  },
})
