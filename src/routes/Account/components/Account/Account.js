import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAccount, updateAccount, logout } from 'store/modules/user'
import AccountForm from '../AccountForm'
import './Account.css'

const Account = props => {
  const curPassword = useRef(null)
  const formRef = useRef(null)

  const user = useSelector(state => state.user)
  const [isDirty, setDirty] = useState(false)

  // once per mount
  useEffect(() => dispatch(fetchAccount()), [])

  const dispatch = useDispatch()
  const handleDirtyChange = useCallback(isDirty => setDirty(isDirty))
  const handleSignOut = useCallback(() => dispatch(logout()), [dispatch])
  const handleSubmit = useCallback(() => {
    if (!curPassword.current.value.trim()) {
      alert('Please enter your current password to make changes.')
      curPassword.current.focus()
      return
    }

    const data = formRef.current.getData()
    data.append('password', curPassword.current.value)
    dispatch(updateAccount(data))
  }, [dispatch])

  return (
    <div styleName='container'>
      <h1 styleName='title'>My Account</h1>
      <div styleName='content'>
        <p>Signed in as <strong>{user.username}</strong></p>

        <AccountForm
          user={user}
          onDirtyChange={handleDirtyChange}
          ref={formRef}
        >
          {isDirty &&
            <>
              <br />
              <input type='password'
                autoComplete='current-password'
                placeholder='current password'
                ref={curPassword}
                // styleName='field'
              />
            </>
          }
        </AccountForm>

        {isDirty &&
          <button onClick={handleSubmit} className='primary'>
            Update Account
          </button>
        }

        <button onClick={handleSignOut} styleName='signOut'>
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default Account
