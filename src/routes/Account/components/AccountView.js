import React, { PropTypes } from 'react'
import Header from 'components/Header'
import Login from './Login'
import Logout from './Logout'
import AccountForm from '../components/AccountForm'
import classes from './AccountView.css'

export class AccountView extends React.Component {
  static propTypes = {
    user: PropTypes.object,
    rooms: PropTypes.array.isRequired,
    loginUser: PropTypes.func.isRequired,
    logoutUser: PropTypes.func.isRequired,
    createUser: PropTypes.func.isRequired,
    updateUser: PropTypes.func.isRequired
  }

  state = {
    viewMode: 'login' // default
  }

  render () {
    const {user, loginUser, logoutUser, createUser, updateUser, errorMessage} = this.props
    let viewMode = user ? 'edit' : this.state.viewMode
    let headerTitle = user ? user.name : (viewMode === 'login') ? 'Sign in' : 'Create Account'

    return (
      <div>
        <Header title={headerTitle}/>
        <div className={classes.primary}>
          {viewMode === 'login' &&
            <div>
              <p>Sign in below or <a onClick={() => this.setState({viewMode: 'create'})}>create a new account</a>.</p>
              <Login onSubmitClick={creds => loginUser(creds)} rooms={this.props.rooms}/>
            </div>
          }

          {viewMode === 'create' &&
            <div>
              <p>Create an account or <a onClick={() => this.setState({viewMode: 'login'})}>sign in with an existing one</a>.</p>
              <AccountForm
                onSubmitClick={createUser}
                viewMode={viewMode}
              />
            </div>
          }

          {viewMode === 'edit' &&
            <div>
              <p>You may edit any account information here.</p>
              <AccountForm
                defaultName={user.name}
                defaultEmail={user.email}
                viewMode={viewMode}
                onSubmitClick={updateUser}
              />
            </div>
          }

          {errorMessage &&
            <p style={{color:'red'}}>{errorMessage}</p>
          }

          {user &&
            <Logout
              onLogoutClick={ () => logoutUser() }
            />
          }

        </div>
      </div>
    )
  }
}

export default AccountView
