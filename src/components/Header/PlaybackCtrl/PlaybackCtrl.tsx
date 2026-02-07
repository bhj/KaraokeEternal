import React, { useCallback, useState } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { useLocation } from 'react-router'
import clsx from 'clsx'
import screenfull from 'screenfull'
import { requestOptions, requestPause, requestPlay, requestPlayNext, requestVolume } from 'store/modules/status'
import { VISUALIZER_HYDRA_CODE_REQ } from 'shared/actionTypes'
import { getPresetByIndex, getNextPreset, getPrevPreset, getRandomPreset } from 'routes/Orchestrator/components/hydraPresets'
import Button from 'components/Button/Button'
import VolumeSlider from './VolumeSlider/VolumeSlider'
import NoPlayer from './NoPlayer/NoPlayer'
import DisplayCtrl from './DisplayCtrl/DisplayCtrl'
import styles from './PlaybackCtrl.css'
import { PlaybackOptions, AUDIO_RESPONSE_DEFAULTS } from 'shared/types'

const handleFullscreen = () => {
  if (screenfull.isEnabled) {
    const el = document.getElementById('player-fs-container')
    screenfull.request(el)
  }
}

const PlaybackCtrl = () => {
  const [isDisplayCtrlVisible, setDisplayCtrlVisible] = useState(false)
  const location = useLocation()
  const isPlayer = location.pathname.replace(/\/$/, '').endsWith('/player')

  const isGuest = useAppSelector(state => state.user.isGuest)
  const isInRoom = useAppSelector(state => state.user.roomId !== null)
  const status = useAppSelector(state => state.status)

  const dispatch = useAppDispatch()
  const handleOptions = useCallback((opts: PlaybackOptions) => dispatch(requestOptions(opts)), [dispatch])
  const handlePause = useCallback(() => dispatch(requestPause()), [dispatch])
  const handlePlay = useCallback(() => dispatch(requestPlay()), [dispatch])
  const handlePlayNext = useCallback(() => dispatch(requestPlayNext()), [dispatch])
  const handleVolume = useCallback((val: number) => dispatch(requestVolume(val)), [dispatch])

  const toggleDisplayCtrl = useCallback(() => {
    setDisplayCtrlVisible(!isDisplayCtrlVisible)
  }, [isDisplayCtrlVisible])

  const handleHydraPresetChange = useCallback((direction: 'next' | 'prev' | 'random') => {
    const currentIdx = status.visualizer.hydraPresetIndex ?? 0
    let newIdx: number
    if (direction === 'next') {
      newIdx = getNextPreset(currentIdx)
    } else if (direction === 'prev') {
      newIdx = getPrevPreset(currentIdx)
    } else {
      newIdx = getRandomPreset(currentIdx)
    }
    dispatch({
      type: VISUALIZER_HYDRA_CODE_REQ,
      payload: { code: getPresetByIndex(newIdx), hydraPresetIndex: newIdx },
    })
  }, [dispatch, status.visualizer.hydraPresetIndex])

  if (!status.isPlayerPresent) {
    // Show launch button for non-guest users in a room (admins and standard users)
    return (!isGuest && isInRoom && screenfull.isEnabled) ? <NoPlayer /> : null
  }

  return (
    <div className={styles.container}>
      <Button
        animateClassName={styles.btnAnimate}
        className={clsx(styles.btn, status.isPlaying ? styles.pause : styles.play)}
        icon={status.isPlaying ? 'PAUSE' : 'PLAY'}
        onClick={status.isPlaying ? handlePause : handlePlay}
        aria-label={status.isPlaying ? 'Pause' : 'Play'}
      />

      <Button
        animateClassName={styles.btnAnimate}
        className={clsx(styles.btn, styles.next)}
        icon='PLAY_NEXT'
        onClick={handlePlayNext}
        aria-label='Play Next'
      />

      <VolumeSlider
        volume={status.volume}
        onVolumeChange={handleVolume}
      />

      <Button
        className={clsx(styles.btn, styles.displayCtrl)}
        icon='TUNE'
        onClick={toggleDisplayCtrl}
        size={48}
        aria-label='Display Options'
      />

      {isPlayer && screenfull.isEnabled && (
        <Button
          className={clsx(styles.btn, styles.fullscreen)}
          icon='FULLSCREEN'
          onClick={handleFullscreen}
          aria-label='Enter Fullscreen'
        />
      )}

      {isDisplayCtrlVisible && (
        <DisplayCtrl
          cdgAlpha={status.cdgAlpha}
          cdgSize={status.cdgSize}
          isVideoKeyingEnabled={status.isVideoKeyingEnabled}
          isVisualizerEnabled={status.visualizer.isEnabled}
          isWebGLSupported={status.isWebGLSupported}
          mediaType={status.mediaType}
          mp4Alpha={status.mp4Alpha}
          onClose={toggleDisplayCtrl}
          onRequestOptions={handleOptions}
          sensitivity={status.visualizer.sensitivity}
          visualizerPresetName={status.visualizer.hydraPresetName ?? ''}
          visualizerMode={status.visualizer.mode}
          audioResponse={{ ...AUDIO_RESPONSE_DEFAULTS, ...status.visualizer.audioResponse }}
          allowCamera={status.visualizer.allowCamera ?? false}
          cycleOnSongTransition={status.visualizer.cycleOnSongTransition ?? false}
          onHydraPresetChange={handleHydraPresetChange}
        />
      )}
    </div>
  )
}

export default PlaybackCtrl
