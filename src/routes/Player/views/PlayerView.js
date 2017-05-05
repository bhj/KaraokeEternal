import PropTypes from 'prop-types'
import React from 'react'
import PlayerHeader from '../components/PlayerHeader'
import Player from '../components/Player'
import screenfull from 'screenfull'
import './PlayerView.css'

class PlayerView extends React.Component {
  static propTypes = {
    viewportStyle: PropTypes.object.isRequired,
  }

  render () {
    const { width, height, paddingTop, paddingBottom } = this.props.viewportStyle
    const { isFullscreen } = screenfull

    return (
      <div style={{ overflow: 'hidden' }}>
        <PlayerHeader requestFullscreen={this.handleFullscreen} />
        <div
          ref={r => { this.ref = r }}
          styleName='container'
          style={isFullscreen ? {} : {
            marginTop: paddingTop,
            height: height - paddingTop - paddingBottom,
          }}
        >
          <Player
            width={width}
            height={height - (isFullscreen ? 0 : paddingTop + paddingBottom)}
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
