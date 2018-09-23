import PropTypes from 'prop-types'
import React, { Component } from 'react'
import AccountForm from './AccountForm'
import './Account.css'

export default class Account extends Component {
  static propTypes = {
    user: PropTypes.object,
    // actions
    updateUser: PropTypes.func.isRequired,
    logoutUser: PropTypes.func.isRequired,
  }

  render () {
    const { user } = this.props

    return (
      <div styleName='container'>
        <h1 styleName='title'>My Account</h1>
        <div styleName='content'>
          <p>Signed in as <strong>{user.username}</strong></p>

          <AccountForm user={user} onSubmitClick={this.props.updateUser} showRoom={false} />

          <button onClick={this.props.logoutUser} styleName='signOut'>
            Sign Out
          </button>
        </div>
      </div>
    )
  }
}
