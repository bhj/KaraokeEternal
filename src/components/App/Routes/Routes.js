import PropTypes from 'prop-types'
import React from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

import AccountView from 'routes/Account/views'
import LibraryView from 'routes/Library/views'
import QueueView from 'routes/Queue/views/QueueView'
const PlayerView = React.lazy(() => import('routes/Player/views/PlayerView'))

const Routes = (props) => (
  <Switch>
    <Route exact path='/account'>
      <AccountView setHeader={props.setHeader} />
    </Route>
    <ProtectedRoute exact path='/library' redirect='/account'>
      <LibraryView setHeader={props.setHeader} />
    </ProtectedRoute>
    <ProtectedRoute exact path='/queue' redirect='/account'>
      <QueueView setHeader={props.setHeader} />
    </ProtectedRoute>
    <ProtectedRoute exact path='/player' redirect='/account'>
      <PlayerView setHeader={props.setHeader} />
    </ProtectedRoute>
    <Route>
      <Redirect to='/library' />
    </Route>
  </Switch>
)

Routes.propTypes = {
  setHeader: PropTypes.func.isRequired,
}

export default Routes
