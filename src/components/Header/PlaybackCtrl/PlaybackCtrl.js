import PropTypes from 'prop-types'
import React from 'react'
import screenfull from 'screenfull'
import Icon from 'components/Icon'
import VolumeSlider from './VolumeSlider'
import NoPlayer from './NoPlayer'
import './PlaybackCtrl.css'

const PlaybackCtrl = (props) => {
  if (!props.isPlayerPresent) {
    return (props.isAdmin && props.isInRoom && screenfull.enabled) ? <NoPlayer /> : null
  }

  const { isPlaying } = props

  return (
    <div styleName='container'>
      {isPlaying &&
        <div onClick={props.requestPause}>
          <Icon icon='PAUSE' size={42} styleName='pause' />
        </div>
      }
      {!isPlaying &&
        <div onClick={props.requestPlay}>
          <Icon icon='PLAY' size={42} styleName='play' />
        </div>
      }

      <div onClick={props.requestPlayNext}>
        <Icon icon='PLAY_NEXT' size={48} styleName='next'/>
      </div>

      <VolumeSlider
        volume={props.volume}
        onVolumeChange={props.requestVolume}
      />
    </div>
  )
}

PlaybackCtrl.propTypes = {
  isAdmin: PropTypes.bool.isRequired,
  isInRoom: PropTypes.bool.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  isAtQueueEnd: PropTypes.bool.isRequired,
  volume: PropTypes.number.isRequired,
  isPlayerPresent: PropTypes.bool.isRequired,
  // actions
  requestPlay: PropTypes.func.isRequired,
  requestPlayNext: PropTypes.func.isRequired,
  requestPause: PropTypes.func.isRequired,
  requestVolume: PropTypes.func.isRequired,
}

export default PlaybackCtrl
