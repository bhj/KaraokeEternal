import PropTypes from 'prop-types'
import React from 'react'
import { browserHistory } from 'react-router'
import Header from 'components/Header'
import Prefs from './Prefs'
import AccountForm from './AccountForm'
import Logout from './Logout'

function AccountView (props) {
  const { viewportStyle, ...restProps } = props

  return (
    <div style={{ ...viewportStyle }}>
      <Header />

      <AccountForm {...restProps} />

      <Prefs />

      {props.user.isAdmin &&
        <button className='button wide blue raised' onClick={() => { browserHistory.push('/player') }}>
          Start Player
        </button>
      }

      {props.user.userId !== null &&
        <div>
          <br />
          <Logout onLogoutClick={props.logoutUser} />
        </div>
      }
    </div>
  )
}

AccountView.propTypes = {
  user: PropTypes.object,
  viewportStyle: PropTypes.object.isRequired,
  // actions
  logoutUser: PropTypes.func.isRequired,
}

export default AccountView
