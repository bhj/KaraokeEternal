import PropTypes from 'prop-types'
import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

import AccountView from 'routes/Account/views'
import LibraryView from 'routes/Library/views'
import QueueView from 'routes/Queue/views/QueueView'
const PlayerView = React.lazy(() => import('routes/Player/views/PlayerView'))

function AppRoutes(props) {
  const location = useLocation().search;
  const libraryLocation = '/library'+location
  return (
    <Routes>
      <Route path='/account' element={<AccountView />} />
      <Route path='/library' element={
        <RequireAuth path='/library' redirectTo='/account'>
          <LibraryView />
        </RequireAuth>
      } />
      <Route path='/queue' element={
        <RequireAuth path='/queue' redirectTo='/account'>
          <QueueView />
        </RequireAuth>
      } />
      <Route path='/player' element={
        <RequireAuth path='/player' redirectTo='/account'>
          <PlayerView />
        </RequireAuth>
      } />
      <Route path='/' element={<Navigate to={libraryLocation} />} />
    </Routes>
  )
}

export default AppRoutes

const RequireAuth = ({ children, path, redirectTo }) => {
  const isAuthenticated = useSelector(state => state.user.userId !== null)
  const location = useLocation()

  if (!isAuthenticated) {
    // set their originally-desired location in query parameter
    const params = new URLSearchParams(location.search)
    params.set('redirect', path);
    

    return <Navigate to={redirectTo + '?' + params.toString() }/>
  }

  return children
}

RequireAuth.propTypes = {
  children: PropTypes.node.isRequired,
  path: PropTypes.string.isRequired,
  redirectTo: PropTypes.string.isRequired,
}
