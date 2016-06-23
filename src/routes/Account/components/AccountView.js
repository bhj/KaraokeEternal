import React, { PropTypes } from 'react'
import Header from 'components/Header'
import AccountForm from '../containers/AccountForm'
import Logout from './Logout'
import classes from './AccountView.css'

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
      <div className={classes.flexContainer}>
        <Header title={headerTitle}/>

        <div className={classes.primary}>
          <AccountForm/>

          {errorMessage &&
            <p style={{color:'red'}}>{errorMessage}</p>
          }

          {this.props.user &&
            <div>
              <br/>
              <Logout onLogoutClick={this.props.logoutUser} />
            </div>
          }
        </div>
      </div>
    )
  }
}

export default AccountView
