import React, { PropTypes } from 'react'
import Login from 'components/Login'
import Logout from 'components/Logout'
import Edit from '../components/Edit'

export class AccountView extends React.Component {
  static propTypes = {
    // dispatch: PropTypes.func.isRequired,
    user: PropTypes.object.isRequired,
    loginUser: PropTypes.func.isRequired,
    logoutUser: PropTypes.func.isRequired
  }

  state = {
    isNew: true // whether we're creating a new account
  }

  toggleNew () {
    this.setState({isNew: !this.state.isNew})
  }

  render () {
    const {user, loginUser, logoutUser, createUser} = this.props

    return (
      <div className='container'>
        <h1>Account</h1>
        {!user.isAuthenticated && !this.state.isNew &&
          <Login
            onLoginClick={ creds => loginUser(creds) }
            onToggleNewClick={() => this.toggleNew()}
            errorMessage={user.errorMessage}
          />
        }

        {(user.isAuthenticated || this.state.isNew) &&
          <Edit
            isNew={this.state.isNew}
            onToggleNewClick={() => this.toggleNew()}
            onCreateClick={ user => createUser(user) }
            name={this.state.isNew ? '' : user.name}
            email={this.state.isNew ? '' : user.email}
            errorMessage={user.errorMessage}
          />
        }

        {user.isAuthenticated &&
          <Logout
            onLogoutClick={ () => logoutUser() }
          />
        }
      </div>
    )
  }
}

export default AccountView
