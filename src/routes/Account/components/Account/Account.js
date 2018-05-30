import PropTypes from 'prop-types'
import React, { Component } from 'react'
import Login from './Login'
import Logout from './Logout'
import AccountForm from './AccountForm'
import './Account.css'

export default class Account extends Component {
  static propTypes = {
    user: PropTypes.object,
    isLoggedIn: PropTypes.bool.isRequired,
    isFirstRun: PropTypes.bool.isRequired,
    // actions
    loginUser: PropTypes.func.isRequired,
    createUser: PropTypes.func.isRequired,
    updateUser: PropTypes.func.isRequired,
    logoutUser: PropTypes.func.isRequired,
  }

  state = {
    mode: 'login',
  }

  toggleMode = () => this.setState({
    mode: this.state.mode === 'login' ? 'create' : 'login'
  })

  render () {
    const { user, isFirstRun, isLoggedIn } = this.props
    const { mode } = this.state

    return (
      <div styleName='container'>
        {!isFirstRun && !isLoggedIn && mode === 'login' &&
          <div>
            <h1 styleName='title'>Karaoke Forever</h1>
            <div styleName='content'>
              <p>Sign in or <a onClick={this.toggleMode}>create an account</a> to join the party.</p>
              <Login onSubmitClick={this.props.loginUser} />
            </div>
          </div>
        }

        {isFirstRun &&
          <div>
            <h1 styleName='title'>Karaoke Forever</h1>
            <div styleName='content'>
              <p>Create your <b>admin</b> account to get started.</p>
              <AccountForm requireRoom={false} user={null} onSubmitClick={this.props.createUser} />
            </div>
          </div>
        }

        {!isFirstRun && !isLoggedIn && mode === 'create' &&
          <div>
            <h1 styleName='title'>Karaoke Forever</h1>
            <div styleName='content'>
              <p>Create an account to join the party.<br />
                Already have an account? <a onClick={this.toggleMode}>Sign in</a>
              </p>
              <AccountForm requireRoom user={null} onSubmitClick={this.props.createUser} />
            </div>
          </div>
        }

        {isLoggedIn &&
          <div>
            <h1 styleName='title'>My Account</h1>
            <div styleName='content'>
              <p>Signed in as <strong>{user.username}</strong></p>
              <AccountForm requireRoom={false} user={user} onSubmitClick={this.props.updateUser} />
              <br />
              <Logout onLogoutClick={this.props.logoutUser} />
            </div>
          </div>
        }
      </div>
    )
  }
}
