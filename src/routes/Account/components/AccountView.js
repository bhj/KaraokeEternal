import React, { PropTypes } from 'react'
import Header from 'components/Header'
import AccountForm from '../containers/AccountForm'
import classes from './AccountView.css'

class AccountView extends React.Component {
  static propTypes = {
    user: PropTypes.object,
    viewMode: PropTypes.string.isRequired,
    errorMessage: PropTypes.string
  }

  render () {
    const { user, errorMessage } = this.props
    const headerTitle = user ? user.name : (this.props.viewMode === 'login') ? 'Sign in' : 'Create Account'

    return (
      <div className={classes.flexContainer}>
        <Header title={headerTitle}/>

        {errorMessage &&
          <p style={{color:'red'}}>{errorMessage}</p>
        }

        <div className={classes.primary}>
          <AccountForm/>
        </div>
      </div>
    )
  }
}

export default AccountView
