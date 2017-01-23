import { UserAuthWrapper } from 'redux-auth-wrapper'
import { browserHistory } from 'react-router'

// Redirects to /login by default
const requireAuth = UserAuthWrapper({
  // how to get the user state
  authSelector: state => { return state.account.user },
  failureRedirectPath: '/account',
  wrapperDisplayName: 'requireAuth', // a nice name for this auth check
  redirectAction: (newLoc) => (dispatch) => {
     browserHistory.push(newLoc)
     // dispatch(addNotification({ message: 'Sorry, you are not an administrator' }));
  },
})

export default requireAuth
