import PropTypes from 'prop-types'
import React, { useEffect, useLayoutEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import About from '../components/About'
import Account from '../components/Account'
import Login from '../components/Login'
import Prefs from '../components/Prefs'
import Rooms from '../components/Rooms'
import { fetchPrefs } from 'store/modules/prefs'
import './AccountView.css'

const AccountView = props => {
  const { isAdmin, userId } = useSelector(state => state.user)
  const isLoggedIn = userId !== null
  const ui = useSelector(state => state.ui)
  const dispatch = useDispatch()

  useLayoutEffect(() => props.setHeader(null))

  // do this here instead of Prefs component to detect firstRun
  useEffect(() => {
    dispatch(fetchPrefs())
  }, []) // once per mount

  return (
    <div styleName='container' style={{
      paddingTop: ui.headerHeight,
      paddingBottom: ui.footerHeight,
      width: ui.contentWidth,
      height: ui.innerHeight,
    }}>
      {isAdmin &&
        <Rooms ui={ui}/>
      }

      {isAdmin &&
        <Prefs />
      }

      {isLoggedIn &&
        <Account />
      }

      {!isLoggedIn &&
        <Login style={{ maxWidth: Math.max(340, ui.contentWidth * 0.66) }}/>
      }

      {isLoggedIn &&
        <About />
      }
    </div>
  )
}

AccountView.propTypes = {
  setHeader: PropTypes.func.isRequired,
}

export default AccountView
