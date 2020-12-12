import PropTypes from 'prop-types'
import React from 'react'
import { Redirect, Route, Switch, withRouter } from 'react-router-dom'
import requireAuth from 'lib/requireAuth'
import AccountView from 'routes/Account/views'
import LibraryView from 'routes/Library/views'
import QueueView from 'routes/Queue/views/QueueView'

const Library = withRouter(requireAuth(LibraryView))
const Queue = withRouter(requireAuth(QueueView))
const Player = withRouter(requireAuth(React.lazy(() => import('routes/Player/views/PlayerView'))))

const Routes = (props) => (
  <Switch>
    <Route exact path='/account'>
      <AccountView setHeader={props.setHeader} />
    </Route>
    <Route exact path='/library'>
      <Library setHeader={props.setHeader} />
    </Route>
    <Route exact path='/queue'>
      <Queue setHeader={props.setHeader} />
    </Route>
    <Route exact path='/player'>
      <Player setHeader={props.setHeader} />
    </Route>
    <Route>
      <Redirect to='/library' />
    </Route>
  </Switch>
)

Routes.propTypes = {
  setHeader: PropTypes.func.isRequired,
}

export default Routes
