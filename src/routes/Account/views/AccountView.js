import PropTypes from 'prop-types'
import React from 'react'
import About from '../components/About'
import Account from '../components/Account'
import Login from '../components/Login'
import Prefs from '../components/Prefs'
import Rooms from '../components/Rooms'
import './AccountView.css'

const AccountView = (props) => {
  const { isAdmin, isLoggedIn } = props
  React.useLayoutEffect(() => props.setHeader(null))

  return (
    <div styleName='container' style={{
      paddingTop: props.ui.headerHeight,
      paddingBottom: props.ui.footerHeight,
      width: props.ui.contentWidth,
      height: props.ui.innerHeight,
    }}>
      {isAdmin &&
        <Rooms ui={props.ui}/>
      }

      {isAdmin &&
        <Prefs />
      }

      {isLoggedIn &&
        <Account />
      }

      {!isLoggedIn &&
        <Login style={{ maxWidth: Math.max(340, props.ui.contentWidth * 0.66) }}/>
      }

      {isLoggedIn &&
        <About />
      }
    </div>
  )
}

AccountView.propTypes = {
  isAdmin: PropTypes.bool.isRequired,
  isLoggedIn: PropTypes.bool.isRequired,
  setHeader: PropTypes.func.isRequired,
  ui: PropTypes.object.isRequired,
}

export default AccountView
