import React from 'react'
import { useSelector, useStore } from 'react-redux'
import { injectReducer } from 'store/reducers'
import playerReducer from '../modules/player'
import playerVisualizerReducer from '../modules/playerVisualizer'

import QRCode from "react-qr-code";

import PlayerController from '../components/PlayerController'
import screenfull from 'screenfull'
import styles from './PlayerView.css'

const PlayerView = (props) => {
  const { innerWidth, innerHeight, headerHeight, footerHeight } = useSelector(state => state.ui)
  const viewportHeight = innerHeight - headerHeight - footerHeight
  const qrValue = document.baseURI;

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
        <div className="qrCodeWrap" style={{ height: "auto", margin: "0 auto", maxWidth: 82, width: "100%", position: "absolute", bottom: 16, left: 16, backgroundColor: "#fff", padding: "2px", opacity: 0.8 }}>
          <QRCode
            size={256}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            value={qrValue}
            viewBox={`0 0 256 256`}
          />
        </div>
        <PlayerController
          width={innerWidth}
          height={screenfull.isFullscreen ? innerHeight : viewportHeight}
        />
      </div>
    </div>
  )
}

export default PlayerView
