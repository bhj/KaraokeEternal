import PropTypes from 'prop-types'
import React from 'react'
import Header from 'components/Header'
import classes from './PlayerHeader.css'

const PlayerHeader = (props) => (
  <Header>
    <div className={classes.container}>
      <div onClick={props.requestFullscreen} className={classes.fullscreen}>
        <i className='material-icons'>fullscreen</i>
      </div>
    </div>
  </Header>
)

PlayerHeader.propTypes = {
  // actions
  requestFullscreen: PropTypes.func.isRequired,
}

export default PlayerHeader
