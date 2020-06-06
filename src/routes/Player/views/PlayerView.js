import PropTypes from 'prop-types'
import React from 'react'
import PlayerController from '../components/PlayerController'
import Header from 'components/Header'
import screenfull from 'screenfull'
import './PlayerView.css'

class PlayerView extends React.Component {
  static propTypes = {
    ui: PropTypes.object.isRequired,
  }

  render () {
    const { innerWidth, innerHeight, headerHeight, footerHeight } = this.props.ui
    const viewportHeight = innerHeight - headerHeight - footerHeight

    return (
      <>
        <Header />
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
      </>
    )
  }
}

export default PlayerView
