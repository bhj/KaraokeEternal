import PropTypes from 'prop-types'
import React from 'react'
import Measure from 'react-measure'
import PlaybackCtrl from 'components/PlaybackCtrl'
import classes from './Header.css'

const Header = (props) => {
  return (
    <Measure onMeasure={props.setHeaderHeight} whitelist={['height']}>
      <div className={classes.container}>
        {props.isAdmin &&
          <PlaybackCtrl />
        }
        {props.children}
      </div>
    </Measure>
  )
}

Header.propTypes = {
  children: PropTypes.node,
  isAdmin: PropTypes.bool.isRequired,
  setHeaderHeight: PropTypes.func.isRequired,
}

export default Header
