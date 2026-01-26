import React, { useEffect, useState } from 'react'
import screenfull from 'screenfull'
import combinedReducer from 'store/reducers'
import { useAppSelector, useAppDispatch } from 'store/hooks'
import playerReducer, { sliceInjectNoOp } from '../modules/player'
import playerVisualizerReducer from '../modules/playerVisualizer'
import PlayerController from '../components/PlayerController/PlayerController'
import { fetchCurrentRoom } from 'store/modules/rooms'
import styles from './PlayerView.css'

const PlayerView = () => {
  const { innerWidth, innerHeight, headerHeight, footerHeight } = useAppSelector(state => state.ui)
  const viewportHeight = innerHeight - headerHeight - footerHeight
  const dispatch = useAppDispatch()
  const [showAudioOverlay, setShowAudioOverlay] = useState(true)

  const handleEnableAudio = () => {
    setShowAudioOverlay(false)
  }

  // @todo: find better place for this?
  if (!useAppSelector(state => state.player)) {
    combinedReducer.inject({ reducerPath: 'player', reducer: playerReducer })
    combinedReducer.inject({ reducerPath: 'playerVisualizer', reducer: playerVisualizerReducer })
    dispatch(sliceInjectNoOp()) // update store with new slices
  }

  // once per mount
  useEffect(() => {
    dispatch(fetchCurrentRoom())
  }, [dispatch])

  // set page title
  useEffect(() => {
    document.title = 'Karaoke Eternal | Player'
  }, [])

  return (
    <div style={{ overflow: 'hidden' }}>
      {showAudioOverlay && (
        <div className={styles.audioOverlay} onClick={handleEnableAudio}>
          <div className={styles.audioOverlayContent}>
            <p>Click anywhere to enable audio</p>
          </div>
        </div>
      )}
      <div
        id='player-fs-container'
        className={styles.container}
        style={{
          top: screenfull.isFullscreen ? 0 : headerHeight,
          width: innerWidth,
          height: screenfull.isFullscreen ? innerHeight : viewportHeight,
          overflow: 'hidden',
        }}
      >
        <PlayerController
          width={innerWidth}
          height={screenfull.isFullscreen ? innerHeight : viewportHeight}
        />
      </div>
    </div>
  )
}

export default PlayerView
