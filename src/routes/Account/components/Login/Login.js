import PropTypes from 'prop-types'
import React, { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Logo from 'components/Logo'
import LoginForm from './LoginForm'
import AccountForm from '../Account/AccountForm'
import { login, createAccount } from 'store/modules/user'
import './Login.css'

const Login = props => {
  const [isCreating, setCreating] = useState(false)
  const toggleCreate = useCallback(() => setCreating(!isCreating))

  const isFirstRun = useSelector(state => state.prefs.isFirstRun === true)
  const user = useSelector(state => state.user)

  const dispatch = useDispatch()
  const handleLogin = useCallback(data => dispatch(login(data)), [dispatch])
  const handleCreate = useCallback(data => dispatch(createAccount(data)), [dispatch])

  return (
    <div styleName='container' style={props.style}>
      <Logo styleName='logo'/>

      {!isFirstRun && !isCreating &&
      <>
        <div styleName='heading'>
          <h1>Sign In</h1>
          <span><a onClick={toggleCreate}>Don&rsquo;t have an account?</a></span>
        </div>
        <LoginForm onSubmitClick={handleLogin} />
      </>
      }

      {!isFirstRun && isCreating &&
      <>
        <div styleName='heading'>
          <h1>Create Account</h1>
          <span><a onClick={toggleCreate}>Already have an account?</a></span>
        </div>
        <AccountForm user={user} onSubmitClick={handleCreate} showRoom />
      </>
      }

      {isFirstRun &&
      <>
        <div styleName='heading'>
          <h1>Welcome</h1>
          <p>Create your <b>admin</b> account to get started. Your data is locally stored and never shared.</p>
        </div>
        <AccountForm user={user} onSubmitClick={handleCreate} showRoom={false} />
      </>
      }
    </div>
  )
}

Login.propTypes = {
  style: PropTypes.object,
}

export default Login
