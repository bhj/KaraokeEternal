import { connectedReduxRedirect } from 'redux-auth-wrapper/history3/redirect'
import { browserHistory } from 'react-router'

const RequireAuth = connectedReduxRedirect({
  // how to check auth status
  authenticatedSelector: state => state.user.userId !== null,
  // HoC's display name
  wrapperDisplayName: 'UserIsAuthenticated',
  // on auth failure
  redirectPath: '/account',
  redirectAction: (newLoc) => (dispatch) => {
    browserHistory.push(newLoc)
  },
})

export default RequireAuth
