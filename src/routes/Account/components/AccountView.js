import PropTypes from 'prop-types'
import React from 'react'
import { browserHistory } from 'react-router'
import Header from 'components/Header'
import AccountForm from './AccountForm'
import Logout from './Logout'
import Providers from 'components/providers'

function AccountView (props) {
  const { viewportStyle, ...restProps } = props
  let prefComponents = []

  for (let i in Providers) {
    if (typeof Providers[i].prefComponent !== 'undefined') {
      let PrefPane = Providers[i].prefComponent
      prefComponents.push(<PrefPane key={i} />)
    }
  }

  return (
    <div style={{ ...viewportStyle }}>
      <Header />

      <AccountForm {...restProps} />

      {props.user.isAdmin && prefComponents}

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
