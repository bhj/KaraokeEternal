import PropTypes from 'prop-types'
import React from 'react'
import PlayerController from '../components/PlayerController'
import screenfull from 'screenfull'
import './PlayerView.css'

const PlayerView = (props) => {
  const { innerWidth, innerHeight, headerHeight, footerHeight } = props.ui
  const viewportHeight = innerHeight - headerHeight - footerHeight
  React.useLayoutEffect(() => props.setHeader(null))

  return (
    <div style={{ overflow: 'hidden' }}>
      <div
        id='player-fs-container'
        styleName='container'
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
  ui: PropTypes.object.isRequired,
}

export default PlayerView
