import PropTypes from 'prop-types'
import React, { Component } from 'react'
import Login from './Login'
import AccountForm from './AccountForm'
import './Account.css'

export default class Account extends Component {
  static propTypes = {
    user: PropTypes.object,
    isLoggedIn: PropTypes.bool.isRequired,
    isFirstRun: PropTypes.bool.isRequired,
    // actions
    loginUser: PropTypes.func.isRequired,
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
        <h1 styleName='title'>{isLoggedIn ? 'My Account' : 'Karaoke Forever'}</h1>
        <div styleName='content'>
          {!isFirstRun && !isLoggedIn && mode === 'login' &&
          <>
            <p>Sign in below. <a onClick={this.toggleMode}>Don&rsquo;t have an account?</a></p>
            <Login onSubmitClick={this.props.loginUser} />
          </>
          }

          {isFirstRun &&
          <>
            <p>Create your <b>admin</b> account to get started.</p>
            <AccountForm showRoom={false} />
          </>
          }

          {!isFirstRun && !isLoggedIn && mode === 'create' &&
          <>
            <p>Create an account below. <a onClick={this.toggleMode}>Already have an account?</a></p>
            <AccountForm showRoom />
          </>
          }

          {isLoggedIn &&
          <>
            <p>Signed in as <strong>{user.username}</strong></p>
            <AccountForm showRoom={false} />
          </>
          }
        </div>
      </div>
    )
  }
}
