import { connectedRouterRedirect } from 'redux-auth-wrapper/history4/redirect'

const requireAuth = connectedRouterRedirect({
  // how to check auth status
  authenticatedSelector: state => state.user.userId !== null,
  // HoC's display name
  wrapperDisplayName: 'UserIsAuthenticated',
  // on auth failure
  redirectPath: '/account',
})

export default requireAuth
