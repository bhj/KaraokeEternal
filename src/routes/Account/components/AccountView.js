import React, { PropTypes } from 'react'
import { browserHistory } from 'react-router'
import { Header, HeaderTitle } from 'components/Header'
import Navigation from 'components/Navigation'
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
      <div style={{flex: '1', padding: '1em'}}>
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
      </div>
    )
  }
}

export default AccountView
