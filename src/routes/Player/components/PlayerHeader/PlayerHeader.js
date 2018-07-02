import React from 'react'
import Icon from 'components/Icon'
import screenfull from 'screenfull'
import Header from 'components/Header'
import './PlayerHeader.css'

const PlayerHeader = (props) => (
  <Header>
    <div styleName='container'>
      <div onClick={handleFullscreen}>
        <Icon icon='FULLSCREEN' size={48} styleName='fullscreen' />
      </div>
    </div>
  </Header>
)

const handleFullscreen = () => {
  if (screenfull.enabled) {
    const el = document.getElementById('player-fs-container')
    screenfull.request(el)
  }
}

export default PlayerHeader
