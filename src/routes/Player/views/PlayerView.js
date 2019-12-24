import PropTypes from 'prop-types'
import React from 'react'
import PlayerController from '../components/PlayerController'
import Header from 'components/Header'
import screenfull from 'screenfull'
import './PlayerView.css'

class PlayerView extends React.Component {
  static propTypes = {
    browserWidth: PropTypes.number.isRequired,
    browserHeight: PropTypes.number.isRequired,
    headerHeight: PropTypes.number.isRequired,
    footerHeight: PropTypes.number.isRequired,
  }

  render () {
    const { browserWidth, browserHeight, headerHeight, footerHeight } = this.props
    const viewportHeight = browserHeight - headerHeight - footerHeight

    return (
      <>
        <Header />
        <div style={{ overflow: 'hidden' }}>
          <div
            id='player-fs-container'
            styleName='container'
            style={{
              top: screenfull.isFullscreen ? 0 : headerHeight,
              width: browserWidth,
              height: screenfull.isFullscreen ? browserHeight : viewportHeight,
            }}
          >
            <PlayerController
              width={browserWidth}
              height={screenfull.isFullscreen ? browserHeight : viewportHeight}
            />
          </div>
        </div>
      </>
    )
  }
}

export default PlayerView
