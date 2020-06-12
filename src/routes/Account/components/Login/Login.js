import PropTypes from 'prop-types'
import React, { Component } from 'react'
import Logo from 'components/Logo'
import LoginForm from './LoginForm'
import AccountForm from '../Account/AccountForm'
import './Login.css'

export default class Login extends Component {
  static propTypes = {
    isFirstRun: PropTypes.bool.isRequired,
    style: PropTypes.object,
    user: PropTypes.object.isRequired,
    // actions
    login: PropTypes.func.isRequired,
    createAccount: PropTypes.func.isRequired,
  }

  state = {
    isCreating: false,
  }

  toggleMode = () => this.setState({
    isCreating: !this.state.isCreating,
  })

  render () {
    const { isFirstRun, user } = this.props
    const { isCreating } = this.state

    return (
      <div styleName='container' style={this.props.style}>
        <Logo styleName='logo'/>

        {!isFirstRun && !isCreating &&
        <>
          <div styleName='heading'>
            <h1>Sign in</h1>
            <span><a onClick={this.toggleMode}>Don&rsquo;t have an account?</a></span>
          </div>
          <LoginForm onSubmitClick={this.props.login} />
        </>
        }

        {!isFirstRun && isCreating &&
        <>
          <div styleName='heading'>
            <h1>Create account</h1>
            <span><a onClick={this.toggleMode}>Already have an account?</a></span>
          </div>
          <AccountForm user={user} onSubmitClick={this.props.createAccount} showRoom />
        </>
        }

        {isFirstRun &&
        <>
          <div styleName='heading'>
            <h1>Welcome</h1>
            <p>Create your <b>admin</b> account to get started. Your data is locally stored and never shared.</p>
          </div>
          <AccountForm user={user} onSubmitClick={this.props.createAccount} showRoom={false} />
        </>
        }
      </div>
    )
  }
}
