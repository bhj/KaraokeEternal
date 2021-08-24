import React from 'react'
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
