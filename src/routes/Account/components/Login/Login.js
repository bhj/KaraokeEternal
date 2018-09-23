import PropTypes from 'prop-types'
import React, { Component } from 'react'
import LoginForm from './LoginForm'
import AccountForm from '../Account/AccountForm'
import './Login.css'

export default class Login extends Component {
  static propTypes = {
    isFirstRun: PropTypes.bool.isRequired,
    // actions
    loginUser: PropTypes.func.isRequired,
    createUser: PropTypes.func.isRequired,
  }

  state = {
    view: 'login',
  }

  toggleMode = () => this.setState({
    view: this.state.view === 'login' ? 'create' : 'login'
  })

  render () {
    const { isFirstRun } = this.props
    const { view } = this.state

    return (
      <div styleName='container'>
        <h1 styleName='title'>Karaoke Forever</h1>
        <div styleName='content'>
          {!isFirstRun && view === 'login' &&
          <>
            <p>Sign in below. <a onClick={this.toggleMode}>Don&rsquo;t have an account?</a></p>
            <LoginForm onSubmitClick={this.props.loginUser} />
          </>
          }

          {!isFirstRun && view === 'create' &&
          <>
            <p>Create an account below. <a onClick={this.toggleMode}>Already have an account?</a></p>
            <AccountForm user={false} onSubmitClick={this.props.createUser} showRoom />
          </>
          }

          {isFirstRun &&
          <>
            <p>Create an admin account to get started.</p>
            <AccountForm user={false} onSubmitClick={this.props.createUser} showRoom={false} />
          </>
          }
        </div>
      </div>
    )
  }
}
