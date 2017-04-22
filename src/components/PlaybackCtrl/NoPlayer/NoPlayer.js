import PropTypes from 'prop-types'
import React from 'react'
import { Link } from 'react-router'
import classes from './NoPlayer.css'

export const NoPlayer = (props) => (
  <div className={classes.container}>
    <p className={classes.msg}>
      Player not found in room! <Link to='/player'>Start Player</Link>
    </p>
  </div>
)

NoPlayer.propTypes = {
}

export default NoPlayer
