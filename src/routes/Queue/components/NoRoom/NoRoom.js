import PropTypes from 'prop-types'
import React from 'react'
import { Link } from 'react-router'
import './NoRoom.css'

export const NoRoom = ({ ui }) => (
  <div styleName='container' style={{
    paddingTop: ui.headerHeight,
    paddingBottom: ui.footerHeight,
    width: ui.browserWidth,
    height: ui.browserHeight,
  }}>
    <div styleName='text'>
      <h1>Get a Room!</h1>
      <p><Link to='/account'>Sign in to a room</Link> to start queueing songs.</p>
    </div>
  </div>
)

export default NoRoom

NoRoom.propTypes = {
  ui: PropTypes.object.isRequired,
}
