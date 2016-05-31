import React, { PropTypes } from 'react'
import Header from 'components/Header'
import Login from 'components/Login'
import Logout from 'components/Logout'
import AccountForm from '../components/AccountForm'

export class AccountView extends React.Component {
  static propTypes = {
    user: PropTypes.object.isRequired,
    loginUser: PropTypes.func.isRequired,
    logoutUser: PropTypes.func.isRequired,
    createUser: PropTypes.func.isRequired,
    updateUser: PropTypes.func.isRequired
  }

  state = {
    viewMode: 'login' // default
  }

  render () {
    const {user, loginUser, logoutUser, createUser, updateUser} = this.props
    let viewMode = user.isAuthenticated ? 'edit' : this.state.viewMode

    return (
      <div>
        {viewMode === 'login' &&
          <div>
            <Header title="Sign in"/>
            <p>Sign in below or <a onClick={() => this.setState({viewMode: 'create'})}>create a new account</a>.</p>
            <Login onSubmitClick={ creds => loginUser(creds) } />
          </div>
        }

        {viewMode === 'create' &&
          <div>
            <Header title="Create Account"/>
            <p>Create an account or <a onClick={() => this.setState({viewMode: 'login'})}>sign in with an existing one</a>.</p>
            <AccountForm
              onSubmitClick={createUser}
              viewMode={viewMode}
            />
          </div>
        }

        {viewMode === 'edit' &&
          <div>
            <Header title={user.name} />
            <p>You may edit any account information here.</p>
            <AccountForm
              defaultName={user.name}
              defaultEmail={user.email}
              viewMode={viewMode}
              onSubmitClick={updateUser}
            />
          </div>
        }

        {user.errorMessage &&
          <p style={{color:'red'}}>{user.errorMessage}</p>
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
