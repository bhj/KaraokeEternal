import React, { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { createAccount } from 'store/modules/user'
import Button from 'components/Button/Button'
import Logo from 'components/Logo/Logo'
import AccountForm from '../../components/AccountForm/AccountForm'
import styles from './FirstRun.css'

const FirstRun = () => {
  const ui = useAppSelector(state => state.ui)

  const dispatch = useAppDispatch()
  const handleCreate = useCallback((data: FormData) => {
    dispatch(createAccount(data))
  }, [dispatch])

  return (
    <div className={styles.container} style={{ maxWidth: Math.max(340, ui.contentWidth * 0.66) }}>
      <Logo className={styles.logo} />
      <h1>Welcome</h1>
      <p>
        Create your
        {' '}
        <b>admin</b>
        {' '}
        account to get started. All data is locally stored and never shared.
      </p>
      <AccountForm onSubmit={handleCreate} autoFocus>
        <Button variant='primary' type='submit'>
          Create Account
        </Button>
      </AccountForm>
    </div>

  )
}

export default FirstRun
