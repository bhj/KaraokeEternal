import PropTypes from 'prop-types'
import React from 'react'
import { browserHistory } from 'react-router'
import AppLayout from 'layouts/AppLayout'
import Header from 'components/Header'
import AccountForm from './AccountForm'
import Logout from './Logout'
import Providers from 'components/providers'

function AccountView (props) {
  let prefComponents = []

  for (let i in Providers) {
    if (typeof Providers[i].prefComponent !== 'undefined') {
      let PrefPane = Providers[i].prefComponent
      prefComponents.push(<PrefPane key={i} />)
    }
  }

  return (
    <AppLayout>
      {viewportStyle => (
        <div style={{ ...viewportStyle }}>
          <Header />

          <AccountForm {...props} />

          {prefComponents}

          {props.user && props.user.isAdmin &&
            <button className='button wide blue raised' onClick={() => { browserHistory.push('/player') }}>
              Start Player
            </button>
          }

          {props.user &&
            <div>
              <br />
              <Logout onLogoutClick={props.logoutUser} />
            </div>
          }
        </div>
      )}
    </AppLayout>
  )
}

AccountView.propTypes = {
  user: PropTypes.object,
  // actions
  logoutUser: PropTypes.func.isRequired,
}

export default AccountView
