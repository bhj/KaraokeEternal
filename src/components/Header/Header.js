import React, { PropTypes } from 'react'
import Measure from 'react-measure'
import PlaybackCtrl from 'components/PlaybackCtrl'
import classes from './Header.css'

const Header = (props) => {
  const ViewComponent = props.viewComponent || 'div'
  return (
    <Measure onMeasure={props.onHeight} whitelist={['height']}>
      <div>
        {props.isAdmin &&
          <PlaybackCtrl/>
        }

        <ViewComponent/>
      </div>
    </Measure>
  )
}

Header.PropTypes = {
  isAdmin: PropTypes.bool,
  onHeight: PropTypes.func,
}

export default Header
