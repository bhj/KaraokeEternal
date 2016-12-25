import React from 'react'
import Measure from 'react-measure'
import PlaybackCtrl from 'components/PlaybackCtrl'
import classes from './Header.css'

const Header = (props) => (
  <Measure onMeasure={props.onHeight} whitelist={['height']}>
    <div>
      <h1 className={classes.title}>{props.title}</h1>
      {props.isAdmin &&
        <PlaybackCtrl/>
      }
    </div>
  </Measure>
)

Header.PropTypes = {
  isAdmin: React.PropTypes.bool,
  onHeight: React.PropTypes.func,
}

export default Header
