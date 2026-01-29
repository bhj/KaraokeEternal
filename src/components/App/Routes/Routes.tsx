import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router'
import { useAppSelector } from 'store/hooks'

import AccountView from 'routes/Account/views/AccountView'
import LibraryView from 'routes/Library/views/LibraryView'
import QueueView from 'routes/Queue/views/QueueView'
import JoinLandingPage from 'routes/Join/views/JoinLandingPage'

const PlayerView = React.lazy(() => import('routes/Player/views/PlayerView'))
const OrchestratorView = React.lazy(() => import('routes/Orchestrator/views/OrchestratorView'))

const AppRoutes = () => (
  <Routes>
    <Route path='/account' element={<AccountView />} />
    <Route
      path='/library'
      element={(
        <RequireAuth path='/library' redirectTo='/account'>
          <LibraryView />
        </RequireAuth>
      )}
    />
    <Route
      path='/queue'
      element={(
        <RequireAuth path='/queue' redirectTo='/account'>
          <QueueView />
        </RequireAuth>
      )}
    />
    <Route
      path='/player'
      element={(
        <RequireAuth path='/player' redirectTo='/account'>
          <PlayerView />
        </RequireAuth>
      )}
    />
    <Route
      path='/orchestrator'
      element={(
        <RequireAdmin redirectTo='/account'>
          <OrchestratorView />
        </RequireAdmin>
      )}
    />
    <Route path='/join' element={<JoinLandingPage />} />
    <Route
      path='/'
      element={(
        <Navigate
          to={{
            pathname: '/library',
            search: window.location.search, // pass through search params (e.g. roomId)
          }}
          replace
        />
      )}
    />
  </Routes>
)

export default AppRoutes

interface RequireAdminProps {
  children: React.ReactNode
  redirectTo: string
}

const RequireAdmin = ({ children, redirectTo }: RequireAdminProps) => {
  const { isAdmin, userId } = useAppSelector(state => state.user)

  if (userId === null || !isAdmin) {
    return <Navigate to={redirectTo} replace />
  }

  return children
}

interface RequireAuthProps {
  children: React.ReactNode
  path: string
  redirectTo: string
}

const RequireAuth = ({
  children,
  path,
  redirectTo,
}: RequireAuthProps) => {
  const { isGuest, userId } = useAppSelector(state => state.user)
  const location = useLocation()

  // Player route requires non-guest user (admins and standard users can launch player)
  if (path === '/player' && isGuest) {
    return <Navigate to='/' replace />
  }

  if (userId === null) {
    // set their originally-desired location in query parameter
    const params = new URLSearchParams(location.search)
    params.set('redirect', path)

    return <Navigate to={redirectTo + '?' + params.toString()} replace />
  }

  return children
}
