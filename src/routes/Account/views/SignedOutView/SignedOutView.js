import React, { useCallback, useState } from 'react'
import { useSelector } from 'react-redux'
import Logo from 'components/Logo'
import Create from './Create'
import FirstRun from './FirstRun'
import SignIn from './SignIn'
import styles from './SignedOutView.css'
import { isPublicDevice } from '../../../Library/components/SongList/SongList'
import { hasCreatedAccountHereBefore, hasSignedInHereBefore } from '../../../../store/modules/user'

const SignedOutView = props => {
  const defaultIsSignIn = isPublicDevice || hasCreatedAccountHereBefore() || hasSignedInHereBefore()
  const [isCreating, setCreating] = useState(!defaultIsSignIn)
  const toggleCreate = useCallback(() => setCreating(prevState => !prevState), [])

  const isFirstRun = useSelector(state => state.prefs.isFirstRun === true)
  const ui = useSelector(state => state.ui)

  return (
    <div className={styles.container} style={{ maxWidth: Math.max(340, ui.contentWidth * 0.66) }}>
      <Logo className={styles.logo}/>

      {isCreating &&
        <Create onToggle={toggleCreate}/>
      }

      {!isFirstRun && !isCreating &&
        <SignIn onToggle={toggleCreate}/>
      }

      {isFirstRun &&
        <FirstRun/>
      }
    </div>
  )
}

export default SignedOutView
