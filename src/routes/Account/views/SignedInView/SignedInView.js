import React, { useEffect } from 'react'
import { injectReducer } from 'store/reducers'
import { useSelector, useStore } from 'react-redux'
import usersReducer from '../../modules/users'
import About from '../../components/About'
import Account from '../../components/Account'
import Prefs from '../../components/Prefs'
import Rooms from '../../components/Rooms'
import Users from '../../components/Users'

const SignedInView = props => {
  const { isAdmin } = useSelector(state => state.user)
  const sliceExists = !!useSelector(state => state.users)
  const store = useStore()

  if (isAdmin && !sliceExists) {
    injectReducer(store, { key: 'users', reducer: usersReducer })
  }

  // this is a workaround for iOS 15 where content is left weirdly
  // scrolled once the keyboard disappears after signing in/creating
  // an account. putting the fix here works for the other views since
  // this SignedInView is briefly rendered prior to any redirects.
  useEffect(() => {
    window.scrollTo(0, 0)
    document.body.scrollTop = 0
  }, [])

  return (
    <>
      {isAdmin &&
        <Rooms/>
      }

      {isAdmin &&
        <Users/>
      }

      {isAdmin &&
        <Prefs />
      }

      <Account />

      <About />
    </>
  )
}

export default SignedInView
