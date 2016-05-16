import React, { Component, PropTypes } from 'react'

export default class Logout extends Component {

  render() {
    return (
      <button className='btn btn-danger' onClick={this.props.onLogoutClick}>
        <i className='fa fa-sign-out'/>{' '}Sign Out
      </button>
    )
  }
}

Logout.propTypes = {
  onLogoutClick: PropTypes.func.isRequired
}
