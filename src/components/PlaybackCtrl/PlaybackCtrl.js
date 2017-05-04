import PropTypes from 'prop-types'
import React from 'react'
import VolumeSlider from './VolumeSlider'
import NoPlayer from './NoPlayer'
import './PlaybackCtrl.css'

const PlaybackCtrl = (props) => {
  if (!props.isAdmin) {
    return null
  }

  if (!props.isPlayerPresent) {
    return <NoPlayer />
  }

  const { isPlaying, isAtQueueEnd } = props

  return (
    <div styleName='container'>
      {isPlaying &&
        <div onClick={props.requestPause} styleName='pause'>
          <i className='material-icons'>pause</i>
        </div>
      }
      {!isPlaying &&
        <div onClick={props.requestPlay} styleName='play'>
          <i className='material-icons'>play_arrow</i>
        </div>
      }

      <div onClick={props.requestPlayNext} styleName={'next ' + (isAtQueueEnd ? ' disabled' : '')}>
        <i className='material-icons'>skip_next</i>
      </div>

      <VolumeSlider
        styleName='volume'
        volume={props.volume}
        onVolumeChange={props.requestVolume}
      />
    </div>
  )
}

PlaybackCtrl.propTypes = {
  isAdmin: PropTypes.bool.isRequired,
  isPlayerPresent: PropTypes.bool.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  isAtQueueEnd: PropTypes.bool.isRequired,
  volume: PropTypes.number.isRequired,
  // actions
  requestPlay: PropTypes.func.isRequired,
  requestPlayNext: PropTypes.func.isRequired,
  requestPause: PropTypes.func.isRequired,
  requestVolume: PropTypes.func.isRequired,
}

export default PlaybackCtrl
