import React, { PropTypes } from 'react'
import Header from 'layouts/Header'
import classes from './PlayerHeader.css'

const PlayerHeader = (props) => (
  <Header>
    <div className={classes.container}>
      <div onClick={props.requestFullscreen} className={classes.fullscreen}>
        <i className="material-icons">fullscreen</i>
      </div>
    </div>
  </Header>
)

PlayerHeader.PropTypes = {
  // actions
  requestFullscreen: PropTypes.func.isRequired,
}

export default PlayerHeader
