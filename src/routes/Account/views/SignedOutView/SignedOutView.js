import React, { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Logo from 'components/Logo'
import LoginForm from '../../components/Account/LoginForm'
import AccountForm from '../../components/Account/AccountForm'
import { login, createAccount } from 'store/modules/user'
import './SignedOutView.css'

const SignedOutView = props => {
  const [isCreating, setCreating] = useState(false)
  const toggleCreate = useCallback(() => setCreating(!isCreating))

  const isFirstRun = useSelector(state => state.prefs.isFirstRun === true)
  const ui = useSelector(state => state.ui)
  const user = useSelector(state => state.user)

  const dispatch = useDispatch()
  const handleLogin = useCallback(data => dispatch(login(data)), [dispatch])
  const handleCreate = useCallback(data => dispatch(createAccount(data)), [dispatch])

  return (
    <div styleName='container' style={{ maxWidth: Math.max(340, ui.contentWidth * 0.66) }}>
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

export default SignedOutView
