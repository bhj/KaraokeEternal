import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAccount, updateAccount, logout } from 'store/modules/user'
import AccountForm from '../AccountForm'
import './Account.css'

const Account = props => {
  const user = useSelector(state => state.user)
  const [isDirty, setDirty] = useState(false)
  const formRef = useRef(null)

  // once per mount
  useEffect(() => dispatch(fetchAccount()), [])

  const dispatch = useDispatch()
  const handleDirtyChange = useCallback(isDirty => setDirty(isDirty)) // @todo add deps?
  const handleSignOut = useCallback(() => dispatch(logout()), [dispatch])
  const handleSubmit = useCallback(() => {
    const data = formRef.current.getData()

    if (!data.get('password')) {
      alert('Please enter your current password to make changes')
      formRef.current.curPassword.focus()
      return
    }

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
          requirePassword={isDirty}
          ref={formRef}
        />

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
