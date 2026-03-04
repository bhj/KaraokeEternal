import React from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { createAccount } from 'store/modules/user'
import { useT } from 'i18n'
import Button from 'components/Button/Button'
import Logo from 'components/Logo/Logo'
import AccountForm from '../../components/AccountForm/AccountForm'
import styles from './FirstRun.css'

const FirstRun = () => {
  const t = useT()
  const ui = useAppSelector(state => state.ui)

  const dispatch = useAppDispatch()
  const handleCreate = (data: FormData) => {
    dispatch(createAccount(data))
  }

  return (
    <div className={styles.container} style={{ maxWidth: Math.max(340, ui.contentWidth * 0.66) }}>
      <Logo className={styles.logo} />
      <h1>{t('firstRun', 'welcome')}</h1>
      <p>
        {t('firstRun', 'adminIntro')}
        {' '}
        <b>{t('firstRun', 'adminBold')}</b>
        {' '}
        {t('firstRun', 'adminIntroEnd')}
      </p>
      <AccountForm onSubmit={handleCreate} autoFocus>
        <Button variant='primary' type='submit'>
          {t('firstRun', 'createAccount')}
        </Button>
      </AccountForm>
    </div>

  )
}

export default FirstRun
