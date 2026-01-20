import React, { useEffect } from 'react'
import combinedReducer from 'store/reducers'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { fetchAccount } from 'store/modules/user'
import usersReducer, { sliceInjectNoOp } from '../../modules/users'
import About from '../../components/About/About'
import Account from '../../components/Account/Account'
import MyRoom from '../../components/MyRoom/MyRoom'
import Prefs from '../../components/Prefs/Prefs'
import Rooms from '../../components/Rooms/Rooms'
import Users from '../../components/Users/Users'

const SignedInView = () => {
  const { isAdmin, isGuest } = useAppSelector(state => state.user)
  const sliceExists = !!useAppSelector(state => state.users)
  const dispatch = useAppDispatch()

  if (isAdmin && !sliceExists) {
    combinedReducer.inject({ reducerPath: 'users', reducer: usersReducer })
    dispatch(sliceInjectNoOp()) // update store with new slice
  }

  // once per mount
  useEffect(() => {
    (async () => dispatch(fetchAccount()))()
  }, [dispatch])

  return (
    <>
      {isAdmin
        && <Rooms />}

      {isAdmin
        && <Users />}

      {isAdmin
        && <Prefs />}

      {!isAdmin && !isGuest
        && <MyRoom />}

      <Account />

      <About />
    </>
  )
}

export default SignedInView
