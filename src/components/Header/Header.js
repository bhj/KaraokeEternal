import PropTypes from 'prop-types'
import React from 'react'
import Measure from 'react-measure'
import PlaybackCtrl from './PlaybackCtrl'
import ProgressBar from './ProgressBar'
import UpNext from './UpNext'
import './Header.css'

const Header = (props) => {
  const { isPlayer, isPlayerPresent, isUpNext, isUpNow, isAdmin } = props

  return (
    <Measure onMeasure={props.headerHeightChange} whitelist={['height']}>
      <div styleName='container' className='bg-blur'>
        {!isPlayer && isPlayerPresent &&
          <UpNext isUpNext={isUpNext} isUpNow={isUpNow} wait={props.wait} />
        }

        {(isUpNow || isAdmin) &&
          <PlaybackCtrl />
        }

        {isAdmin && props.isScanning &&
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
  isUpNext: PropTypes.bool.isRequired,
  isUpNow: PropTypes.bool.isRequired,
  wait: PropTypes.number,
  isScanning: PropTypes.bool.isRequired,
  updateText: PropTypes.string.isRequired,
  updateProgress: PropTypes.number.isRequired,
  // actions
  headerHeightChange: PropTypes.func.isRequired,
  requestScanCancel: PropTypes.func.isRequired,
}

export default Header
