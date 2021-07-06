import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AccountForm from '../../../components/AccountForm'
import { createAccount } from 'store/modules/user'
import styles from './FirstRun.css'

const FirstRun = props => {
  const user = useSelector(state => state.user)

  const dispatch = useDispatch()
  const handleCreate = useCallback(data => {
    dispatch(createAccount(data))
  }, [dispatch])

  return (
    <>
      <div className={styles.heading}>
        <h2>Welcome</h2>
        <p>Create your <b>admin</b> account to get started. All data is locally stored and never shared.</p>
      </div>

      <AccountForm user={user} onSubmit={handleCreate}>
        <button className='primary'>Create Account</button>
      </AccountForm>

    </>
  )
}

export default FirstRun
