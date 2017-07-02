import PropTypes from 'prop-types'
import React from 'react'

export default function Logout (props) {
  return (
    <button onClick={props.onLogoutClick}>
      Sign Out
    </button>
  )
}

Logout.propTypes = {
  onLogoutClick: PropTypes.func.isRequired
}
