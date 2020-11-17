import React, { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import screenfull from 'screenfull'
import history from 'lib/history'
import { requestOptions, requestPause, requestPlay, requestPlayNext, requestVolume } from 'store/modules/status'
import Icon from 'components/Icon'
import VolumeSlider from './VolumeSlider'
import NoPlayer from './NoPlayer'
import DisplayCtrl from './DisplayCtrl'
import './PlaybackCtrl.css'

const handleFullscreen = () => {
  if (screenfull.isEnabled) {
    const el = document.getElementById('player-fs-container')
    screenfull.request(el)
  }
}

const PlaybackCtrl = props => {
  const isAdmin = useSelector(state => state.user.isAdmin)
  const isInRoom = useSelector(state => state.user.roomId !== null)
  const isPlayer = history.location.pathname.startsWith('/player')
  const status = useSelector(state => state.status)
  const ui = useSelector(state => state.ui)

  const dispatch = useDispatch()
  const handleOptions = useCallback(opts => dispatch(requestOptions(opts)), [dispatch])
  const handlePause = useCallback(() => dispatch(requestPause()), [dispatch])
  const handlePlay = useCallback(() => dispatch(requestPlay()), [dispatch])
  const handlePlayNext = useCallback(() => dispatch(requestPlayNext()), [dispatch])
  const handleVolume = useCallback(val => dispatch(requestVolume(val)), [dispatch])

  const [isDisplayCtrlVisible, toggleDisplayCtrl] = useState(false)

  if (!status.isPlayerPresent) {
    return (isAdmin && isInRoom && screenfull.isEnabled) ? <NoPlayer /> : null
  }

  return (
    <div styleName='container'>
      {status.isPlaying &&
        <div onClick={handlePause} styleName='pause'>
          <Icon icon='PAUSE' size={44}/>
        </div>
      }
      {!status.isPlaying &&
        <div onClick={handlePlay} styleName='play'>
          <Icon icon='PLAY' size={44}/>
        </div>
      }

      <div onClick={handlePlayNext} styleName='next'>
        <Icon icon='PLAY_NEXT' size={48}/>
      </div>

      <VolumeSlider
        volume={status.volume}
        onVolumeChange={handleVolume}
      />

      <div onClick={() => toggleDisplayCtrl(!isDisplayCtrlVisible)} styleName='displayCtrl'>
        <Icon icon='TUNE' size={44}/>
      </div>

      {isPlayer && screenfull.isEnabled &&
        <div onClick={handleFullscreen} styleName='fullscreen'>
          <Icon icon='FULLSCREEN' size={48}/>
        </div>
      }

      <DisplayCtrl
        cdgAlpha={status.cdgAlpha}
        cdgSize={status.cdgSize}
        isVisible={isDisplayCtrlVisible}
        isVisualizerEnabled={status.visualizer.isEnabled}
        isWebGLEnabled={status.isWebGLEnabled}
        mediaType={status.mediaType}
        mp4Alpha={status.mp4Alpha}
        onClose={toggleDisplayCtrl}
        onRequestOptions={handleOptions}
        sensitivity={status.visualizer.sensitivity}
        ui={ui}
        visualizerPresetName={status.visualizer.presetName}
      />
    </div>
  )
}

export default PlaybackCtrl
