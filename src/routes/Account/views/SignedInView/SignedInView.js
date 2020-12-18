import React from 'react'
import { useSelector } from 'react-redux'
import About from '../../components/About'
import Account from '../../components/Account'
import Prefs from '../../components/Prefs'
import Rooms from '../../components/Rooms'

const SignedInView = props => {
  const { isAdmin } = useSelector(state => state.user)

  return (
    <>
      {isAdmin &&
        <Rooms/>
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
