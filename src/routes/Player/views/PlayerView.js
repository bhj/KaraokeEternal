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

    return (
      <div style={{ overflow: 'hidden' }}>
        <PlayerHeader requestFullscreen={this.handleFullscreen} />
        <div
          ref={r => { this.ref = r }}
          styleName='container'
          style={{
            marginTop: isFullscreen ? 0 : ui.headerHeight,
          }}
        >
          <PlayerController
            style={{
              width: ui.browserWidth,
              height: isFullscreen ? ui.browserHeight : ui.viewportHeight,
              top: isFullscreen ? 0 : ui.headerHeight,
            }}
          />
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
