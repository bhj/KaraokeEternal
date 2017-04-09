import React, { PropTypes } from 'react'
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

Header.PropTypes = {
  isAdmin: PropTypes.bool,
  setHeaderHeight: PropTypes.func,
}

export default Header
