import PropTypes from 'prop-types'
import React from 'react'
import Measure from 'react-measure'
import PlaybackCtrl from 'components/PlaybackCtrl'
import './Header.css'

const Header = (props) => {
  return (
    <Measure onMeasure={props.setHeaderHeight} whitelist={['height']}>
      <div styleName='container'>
        <PlaybackCtrl {...props} />
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
