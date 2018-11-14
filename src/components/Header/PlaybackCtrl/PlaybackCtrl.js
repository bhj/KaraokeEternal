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

      {props.isPlayer && screenfull.enabled &&
        <div onClick={handleFullscreen}>
          <Icon icon='FULLSCREEN' size={48} styleName='fullscreen' />
        </div>
      }
    </div>
  )
}

PlaybackCtrl.propTypes = {
  isAdmin: PropTypes.bool.isRequired,
  isAtQueueEnd: PropTypes.bool.isRequired,
  isInRoom: PropTypes.bool.isRequired,
  isPlayer: PropTypes.bool.isRequired,
  isPlayerPresent: PropTypes.bool.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  volume: PropTypes.number.isRequired,
  // actions
  requestPlay: PropTypes.func.isRequired,
  requestPlayNext: PropTypes.func.isRequired,
  requestPause: PropTypes.func.isRequired,
  requestVolume: PropTypes.func.isRequired,
}

export default PlaybackCtrl

const handleFullscreen = () => {
  if (screenfull.enabled) {
    const el = document.getElementById('player-fs-container')
    screenfull.request(el)
  }
}
