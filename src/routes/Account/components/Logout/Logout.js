import React, { PropTypes } from 'react'

export default function Logout(props) {
  return (
    <button className='button wide grey raised' onClick={props.onLogoutClick}>
      Sign Out
    </button>
  );
}

Logout.propTypes = {
  onLogoutClick: PropTypes.func.isRequired
}
