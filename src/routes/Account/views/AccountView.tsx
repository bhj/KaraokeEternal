import React, { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { fetchPrefs } from 'store/modules/prefs'
import FirstRun from './FirstRun/FirstRun'
import SignedInView from './SignedInView/SignedInView'
import SignedOutView from './SignedOutView/SignedOutView'
import styles from './AccountView.css'

const AccountView = () => {
  const isSignedIn = useAppSelector(state => state.user.userId !== null)
  const isFirstRun = useAppSelector(state => state.prefs.isFirstRun === true)
  const ui = useAppSelector(state => state.ui)
  const dispatch = useAppDispatch()

  // once per mount
  // (do this here instead of Prefs component to detect firstRun)
  useEffect(() => {
    dispatch(fetchPrefs())
  }, [dispatch])

  return (
    <div
      className={styles.container}
      style={{
        paddingTop: ui.headerHeight,
        paddingBottom: ui.footerHeight,
        width: ui.contentWidth,
        height: ui.innerHeight,
      }}
    >
      {isSignedIn
        && <SignedInView />}

      {!isFirstRun && !isSignedIn
        && <SignedOutView />}

      {isFirstRun
        && <FirstRun />}
    </div>
  )
}

export default AccountView
