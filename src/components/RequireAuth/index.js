import { UserAuthWrapper } from 'redux-auth-wrapper'
import { browserHistory } from 'react-router'

// Redirects to /login by default
const requireAuth = UserAuthWrapper({
  // how to get the user state
  authSelector: state => state.user,
  predicate: user => (user.userId !== null),
  failureRedirectPath: '/account',
  wrapperDisplayName: 'requireAuth', // a nice name for this auth check
  redirectAction: (newLoc) => (dispatch) => {
    browserHistory.push(newLoc)
     // dispatch(addNotification({ message: 'Sorry, you are not an administrator' }));
  },
})

export default requireAuth
