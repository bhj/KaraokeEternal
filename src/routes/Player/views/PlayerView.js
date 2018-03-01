import PropTypes from 'prop-types'
import React from 'react'
import PlayerHeader from '../components/PlayerHeader'
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
        <PlayerHeader requestFullscreen={this.handleFullscreen} />
        <div
          ref={r => { this.ref = r }}
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

  handleFullscreen = () => {
    if (screenfull.enabled) {
      screenfull.request(this.ref)
    }
  }
}

export default PlayerView
