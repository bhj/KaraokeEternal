import React, { Component, PropTypes } from 'react'

export default class Logout extends Component {

  render() {
    return (
      <button className='button wide grey raised' onClick={this.props.onLogoutClick}>
        Sign Out
      </button>
    )
  }
}

Logout.propTypes = {
  onLogoutClick: PropTypes.func.isRequired
}
