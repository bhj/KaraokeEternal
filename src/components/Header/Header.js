import PropTypes from 'prop-types'
import React from 'react'
import PlaybackCtrl from './PlaybackCtrl'
import ProgressBar from './ProgressBar'
import UpNext from './UpNext'
import './Header.css'

const Header = React.forwardRef((props, ref) => {
  const { isPlayer, isPlayerPresent, isUpNext, isUpNow, isAdmin } = props
  const CustomHeader = props.customHeader

  return (
    <div styleName='container' className='bg-blur' ref={ref}>
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

      {props.customHeader &&
        <CustomHeader/>
      }
    </div>
  )
})

Header.displayName = 'Header'
Header.propTypes = {
  customHeader: PropTypes.object,
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
  requestScanCancel: PropTypes.func.isRequired,
}

export default Header
