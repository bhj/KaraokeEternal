import React, { useCallback, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import screenfull from 'screenfull'
import { requestOptions, requestPause, requestPlay, requestPlayNext, requestVolume } from 'store/modules/status'
import Button from 'components/Button'
import VolumeSlider from './VolumeSlider'
import NoPlayer from './NoPlayer'
import DisplayCtrl from './DisplayCtrl'
import styles from './PlaybackCtrl.css'
import { fetchRoom } from 'store/modules/room'

const handleFullscreen = () => {
  if (screenfull.isEnabled) {
    const el = document.getElementById('player-fs-container')
    screenfull.request(el)
  }
}

const PlaybackCtrl = props => {
  const isAdmin = useSelector(state => state.user.isAdmin)
  const isInRoom = useSelector(state => state.user.roomId !== null)
  const status = useSelector(state => state.status)
  const ui = useSelector(state => state.ui)
  const user = useSelector(state => state.user)
  const room = useSelector(state => state.room.entity)

  const location = useLocation()
  const isPlayer = location.pathname.replace(/\/$/, '').endsWith('/player')

  const dispatch = useDispatch()
  const handleOptions = useCallback(opts => dispatch(requestOptions(opts)), [dispatch])
  const handlePause = useCallback(() => dispatch(requestPause()), [dispatch])
  const handlePlay = useCallback(() => dispatch(requestPlay()), [dispatch])
  const handlePlayNext = useCallback(() => dispatch(requestPlayNext()), [dispatch])
  const handleVolume = useCallback(val => dispatch(requestVolume(val)), [dispatch])




  // once per mount
  useEffect(() => {
    dispatch(fetchRoom(user.roomId))
  }, [dispatch])


  const [isDisplayCtrlVisible, setDisplayCtrlVisible] = useState(false)
  const toggleDisplayCtrl = useCallback(() => {
    setDisplayCtrlVisible(!isDisplayCtrlVisible)
  }, [isDisplayCtrlVisible])

  if (!status.isPlayerPresent) {
    return (isAdmin && isInRoom && screenfull.isEnabled) ? <NoPlayer /> : null
  }

  return (
    <div className={styles.container}>
      <Button
        animateClassName={styles.btnAnimate}
        className={status.isPlaying ? styles.pause : styles.play}
        icon={status.isPlaying ? 'PAUSE' : 'PLAY'}
        onClick={status.isPlaying ? handlePause : handlePlay}
        size={44}
      />

      <Button
        animateClassName={styles.btnAnimate}
        className={styles.next}
        icon='PLAY_NEXT'
        onClick={handlePlayNext}
        size={48}
      />

      <VolumeSlider
        volume={status.volume}
        onVolumeChange={handleVolume}
      />

      <Button
        className={styles.displayCtrl}
        icon='TUNE'
        onClick={toggleDisplayCtrl}
        size={48}
      />

      {isPlayer && screenfull.isEnabled &&
        <Button
          className={styles.fullscreen}
          icon='FULLSCREEN'
          onClick={handleFullscreen}
          size={48}
        />
      }

      <DisplayCtrl
        cdgAlpha={status.cdgAlpha}
        cdgSize={status.cdgSize}
        isVisible={isDisplayCtrlVisible}
        isVisualizerEnabled={status.visualizer.isEnabled}
        isWebGLSupported={status.isWebGLSupported}
        mediaType={status.mediaType}
        mp4Alpha={status.mp4Alpha}
        onClose={toggleDisplayCtrl}
        onRequestOptions={handleOptions}
        sensitivity={status.visualizer.sensitivity}
        ui={ui}
        visualizerPresetName={status.visualizer.presetName}
        isRemoteControlQREnabledAllowed={(room.remoteControlQREnabled) ? true : false}
        isRemoteControlQREnabled={status.remoteControlQR.isEnabled}
        isRemoteControlQRAlternateEnabled={status.remoteControlQR.alternate}
        remoteControlTranslucency={status.remoteControlQR.opacity}
        remoteControlSize={status.remoteControlQR.size}
      />
    </div>
  )
}

export default PlaybackCtrl
