import PropTypes from 'prop-types'
import React from 'react'
import PlayerController from '../components/PlayerController'
import screenfull from 'screenfull'
import './PlayerView.css'

class PlayerView extends React.Component {
  static propTypes = {
    ui: PropTypes.object.isRequired,
  }

  render () {
    const { ui } = this.props
    const { isFullscreen } = screenfull
    const height = isFullscreen ? ui.browserHeight : ui.viewportHeight

    return (
      <div style={{ overflow: 'hidden' }}>
        <div
          id='player-fs-container'
          styleName='container'
          style={{
            top: isFullscreen ? 0 : ui.headerHeight,
            width: ui.browserWidth,
            height,
          }}
        >
          <PlayerController width={ui.browserWidth} height={height} />
        </div>
      </div>
    )
  }
}

export default PlayerView
