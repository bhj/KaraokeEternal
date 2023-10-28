import React from 'react'
import { useSelector } from 'react-redux'
import { injectReducer } from 'store/store'
import playerReducer from '../modules/player'
import playerVisualizerReducer from '../modules/playerVisualizer'

import PlayerController from '../components/PlayerController'
import screenfull from 'screenfull'
import styles from './PlayerView.css'

const PlayerView = () => {
  const { innerWidth, innerHeight, headerHeight, footerHeight } = useSelector(state => state.ui)
  const viewportHeight = innerHeight - headerHeight - footerHeight

  // @todo: find better place for this?
  if (!useSelector(state => state.player)) {
    injectReducer({ key: 'player', reducer: playerReducer })
    injectReducer({ key: 'playerVisualizer', reducer: playerVisualizerReducer })
  }

  return (
    <div style={{ overflow: 'hidden' }}>
      <div
        id='player-fs-container'
        className={styles.container}
        style={{
          top: screenfull.isFullscreen ? 0 : headerHeight,
          width: innerWidth,
          height: screenfull.isFullscreen ? innerHeight : viewportHeight,
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
