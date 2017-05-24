import PropTypes from 'prop-types'
import React, { Component } from 'react'
import Header from 'components/Header'
import Prefs from '../components/Prefs'
import AccountForm from '../components/AccountForm'
import Login from '../components/Login'
import Logout from '../components/Logout'

export default class AccountView extends Component {
  static propTypes = {
    isLoggedIn: PropTypes.bool,
    isFirstRun: PropTypes.bool,
    viewportStyle: PropTypes.object.isRequired,
    // actions
    loginUser: PropTypes.func.isRequired,
    logoutUser: PropTypes.func.isRequired,
  }

  state = {
    view: 'login',
  }

  viewLogin = () => this.setState({ view: 'login' })
  viewCreate = () => this.setState({ view: 'create' })

  render () {
    const { viewportStyle, isFirstRun, isLoggedIn, ...props } = this.props
    const { view } = this.state

    return (
      <div style={{ ...viewportStyle }}>
        <Header />

        {!isLoggedIn &&
          <h2>Welcome to Karaoke Forever!</h2>
        }

        {isFirstRun &&
          <div>
            <p>Create your <b>admin</b> account to get started.</p>
            <AccountForm mode='create' {...props} />
          </div>
        }

        {!isFirstRun && !isLoggedIn && view === 'login' &&
          <div>
            <p>Please sign in or <a onClick={this.viewCreate}>create an account</a>.</p>
            <Login onSubmitClick={this.props.loginUser} />
          </div>
        }

        {!isFirstRun && !isLoggedIn && view === 'create' &&
          <div>
            <p>Create an account below to join the party.<br />
              Already have an account? <a onClick={this.viewLogin}>Sign in</a>
            </p>
            <AccountForm mode='create' {...props} />
          </div>
        }

        {isLoggedIn &&
          <div>
            <Prefs />

            <h2>Account</h2>
            <p>You're signed in as <b>{props.user.email}</b></p>
            <AccountForm mode='update' {...props} />

            <Logout onLogoutClick={props.logoutUser} />
          </div>
        }
      </div>
    )
  }
}
