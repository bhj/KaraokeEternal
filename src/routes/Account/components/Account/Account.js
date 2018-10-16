import PropTypes from 'prop-types'
import React, { Component } from 'react'
import AccountForm from './AccountForm'
import './Account.css'

export default class Account extends Component {
  static propTypes = {
    user: PropTypes.object.isRequired,
    // actions
    fetchAccount: PropTypes.func.isRequired,
    updateAccount: PropTypes.func.isRequired,
    logout: PropTypes.func.isRequired,
  }

  componentDidMount () {
    this.props.fetchAccount()
  }

  render () {
    const { user } = this.props

    return (
      <div styleName='container'>
        <h1 styleName='title'>My Account</h1>
        <div styleName='content'>
          <p>Signed in as <strong>{user.username}</strong></p>

          <AccountForm user={user} onSubmitClick={this.props.updateAccount} showRoom={false} />

          <button onClick={this.props.logout} styleName='signOut'>
            Sign Out
          </button>
        </div>
      </div>
    )
  }
}
