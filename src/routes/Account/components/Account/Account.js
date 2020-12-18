import React, { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAccount, updateAccount, logout } from 'store/modules/user'
import AccountForm from './AccountForm'
import './Account.css'

const Account = props => {
  const user = useSelector(state => state.user)

  // once per mount
  useEffect(() => dispatch(fetchAccount()), [])

  const dispatch = useDispatch()
  const handleUpdateAccount = useCallback(data => dispatch(updateAccount(data)), [dispatch])
  const handleSignOut = useCallback(() => dispatch(logout()), [dispatch])

  return (
    <div styleName='container'>
      <h1 styleName='title'>My Account</h1>
      <div styleName='content'>
        <p>Signed in as <strong>{user.username}</strong></p>

        <AccountForm user={user} onSubmitClick={handleUpdateAccount} showRoom={false} />

        <button onClick={handleSignOut} styleName='signOut'>
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default Account
