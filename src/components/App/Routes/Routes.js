import React from 'react'
import { Redirect, Route, Switch, withRouter } from 'react-router-dom'
import RequireAuth from 'components/RequireAuth'
import AccountView from 'routes/Account/views'
import LibraryView from 'routes/Library/views'
import QueueView from 'routes/Queue/views'

const Library = withRouter(RequireAuth(LibraryView))
const Queue = withRouter(RequireAuth(QueueView))
const Player = withRouter(RequireAuth(React.lazy(() => import('routes/Player/views/PlayerView'))))

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

export default Routes
