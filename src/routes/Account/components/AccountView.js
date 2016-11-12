import React, { PropTypes } from 'react'
import { browserHistory } from 'react-router'
import AppLayout from 'layouts/AppLayout'
import AccountForm from '../containers/AccountForm'
import Logout from './Logout'

class AccountView extends React.Component {
  static propTypes = {
    user: PropTypes.object,
    viewMode: PropTypes.string.isRequired,
    logoutUser: PropTypes.func.isRequired,
    errorMessage: PropTypes.string
  }

  render () {
    const { user, errorMessage } = this.props
    const headerTitle = user ? user.name : (this.props.viewMode === 'login') ? 'Sign In' : 'Create Account'

    return (
      <AppLayout title={headerTitle}>
        <AccountForm/>
        {errorMessage &&
          <p style={{color:'red'}}>{errorMessage}</p>
        }

        {this.props.user && this.props.user.isAdmin &&
          <button className='button wide blue raised' onClick={() => {browserHistory.push('/player')}}>
            Start Player
          </button>
        }

        {this.props.user &&
          <div>
            <br/>
            <Logout onLogoutClick={this.props.logoutUser} />
          </div>
        }
      </AppLayout>
    )
  }
}

export default AccountView
