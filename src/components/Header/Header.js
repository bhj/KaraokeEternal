import PropTypes from 'prop-types'
import React from 'react'
import Measure from 'react-measure'
import PlaybackCtrl from 'components/PlaybackCtrl'
import ProgressBar from 'components/ProgressBar'
import UpNext from './UpNext'
import './Header.css'

const Header = (props) => {
  return (
    <Measure onMeasure={props.setHeaderHeight} whitelist={['height']}>
      <div styleName='container' className='bg-blur'>
        {!props.isPlayer && props.isPlayerPresent &&
          <UpNext />
        }

        {props.isAdmin &&
          <PlaybackCtrl />
        }

        {props.isAdmin && props.isUpdating &&
          <ProgressBar
            text={props.updateText}
            progress={props.updateProgress}
            onCancel={props.requestScanCancel}
          />
        }

        {props.children}
      </div>
    </Measure>
  )
}

Header.propTypes = {
  children: PropTypes.node,
  isAdmin: PropTypes.bool.isRequired,
  isPlayer: PropTypes.bool.isRequired,
  isPlayerPresent: PropTypes.bool.isRequired,
  isUpdating: PropTypes.bool.isRequired,
  updateText: PropTypes.string.isRequired,
  updateProgress: PropTypes.number.isRequired,
  // actions
  setHeaderHeight: PropTypes.func.isRequired,
  requestScanCancel: PropTypes.func.isRequired,
}

export default Header
