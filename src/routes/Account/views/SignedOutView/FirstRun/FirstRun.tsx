import React, { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import AccountForm from '../../../components/AccountForm/AccountForm'
import { createAccount } from 'store/modules/user'
import styles from './FirstRun.css'

const FirstRun = () => {
  const user = useAppSelector(state => state.user)

  const dispatch = useAppDispatch()
  const handleCreate = useCallback((data) => {
    dispatch(createAccount(data))
  }, [dispatch])

  return (
    <>
      <div className={styles.heading}>
        <h2>Welcome</h2>
        <p>
          Create your
          <b>admin</b>
          {' '}
          account to get started. All data is locally stored and never shared.
        </p>
      </div>

      <AccountForm user={user} onSubmit={handleCreate}>
        <button className='primary'>Create Account</button>
      </AccountForm>
    </>
  )
}

export default FirstRun
