import PropTypes from 'prop-types'
import React from 'react'
import { useSelector, useStore } from 'react-redux'
import { injectReducer } from 'store/reducers'
import playerReducer from '../modules/player'
import playerVisualizerReducer from '../modules/playerVisualizer'

import PlayerController from '../components/PlayerController'
import screenfull from 'screenfull'
import styles from './PlayerView.css'

const PlayerView = (props) => {
  const { innerWidth, innerHeight, headerHeight, footerHeight } = useSelector(state => state.ui)
  const viewportHeight = innerHeight - headerHeight - footerHeight
  React.useLayoutEffect(() => props.setHeader(null))

  // @todo: find better place for this?
  const store = useStore()
  if (!useSelector(state => state.player)) {
    injectReducer(store, { key: 'player', reducer: playerReducer })
    injectReducer(store, { key: 'playerVisualizer', reducer: playerVisualizerReducer })
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

PlayerView.propTypes = {
  setHeader: PropTypes.func.isRequired,
}

export default PlayerView
