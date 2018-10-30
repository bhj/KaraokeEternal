import PropTypes from 'prop-types'
import React, { Component } from 'react'
import LoginForm from './LoginForm'
import AccountForm from '../Account/AccountForm'
import './Login.css'

export default class Login extends Component {
  static propTypes = {
    user: PropTypes.object.isRequired,
    isFirstRun: PropTypes.bool.isRequired,
    // actions
    login: PropTypes.func.isRequired,
    createAccount: PropTypes.func.isRequired,
  }

  state = {
    view: 'login',
  }

  toggleMode = () => this.setState({
    view: this.state.view === 'login' ? 'create' : 'login'
  })

  render () {
    const { isFirstRun, user } = this.props
    const { view } = this.state

    return (
      <div styleName='container'>
        <h1 styleName='title'>Karaoke Forever</h1>
        <div styleName='content'>
          {!isFirstRun && view === 'login' &&
          <>
            <p>Sign in below. <a onClick={this.toggleMode}>Don&rsquo;t have an account?</a></p>
            <LoginForm onSubmitClick={this.props.login} />
          </>
          }

          {!isFirstRun && view === 'create' &&
          <>
            <p>Create an account below. <a onClick={this.toggleMode}>Already have an account?</a></p>
            <AccountForm user={user} onSubmitClick={this.props.createAccount} showRoom />
          </>
          }

          {isFirstRun &&
          <>
            <p>Welcome! Create your <b>admin</b> account below to get started.
            All accounts are stored locally on your server.</p>
            <AccountForm user={user} onSubmitClick={this.props.createAccount} showRoom={false} />
          </>
          }
        </div>
      </div>
    )
  }
}
