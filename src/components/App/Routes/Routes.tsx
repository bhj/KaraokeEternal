import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router'
import { useAppSelector } from 'store/hooks'

import AccountView from 'routes/Account/views/AccountView'
import LibraryView from 'routes/Library/views/LibraryView'
import QueueView from 'routes/Queue/views/QueueView'
import JoinLandingPage from 'routes/Join/views/JoinLandingPage'
import { getRouteAccessDecision } from './routeAccess'

const PlayerView = React.lazy(() => import('routes/Player/views/PlayerView'))
const OrchestratorView = React.lazy(() => import('routes/Orchestrator/views/OrchestratorView'))
const CameraRelayView = React.lazy(() => import('routes/Camera/views/CameraRelayView'))

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
        <RequireAuth path='/orchestrator' redirectTo='/account'>
          <OrchestratorView />
        </RequireAuth>
      )}
    />
    <Route
      path='/camera'
      element={(
        <RequireAuth path='/camera' redirectTo='/account'>
          <CameraRelayView />
        </RequireAuth>
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
  const { isAdmin, roomId, ownRoomId, userId } = useAppSelector(state => state.user)
  const currentRoomPrefs = useAppSelector((state) => {
    if (typeof state.user.roomId !== 'number') return undefined
    return state.rooms.entities[state.user.roomId]?.prefs
  })
  const location = useLocation()

  if (userId === null) {
    // set their originally-desired location in query parameter
    const params = new URLSearchParams(location.search)
    params.set('redirect', path)

    return <Navigate to={redirectTo + '?' + params.toString()} replace />
  }

  const isRoomOwner = typeof roomId === 'number'
    && typeof ownRoomId === 'number'
    && roomId === ownRoomId

  const access = getRouteAccessDecision({
    path,
    isAdmin,
    isRoomOwner,
    prefs: currentRoomPrefs,
  })

  if (!access.allowed) {
    return <Navigate to={access.redirectTo ?? '/library'} replace />
  }

  return children
}
