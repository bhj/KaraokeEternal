import React from 'react'
import Icon from 'components/Icon'
import screenfull from 'screenfull'
import './PlayerHeader.css'

const PlayerHeader = (props) => (
  <div styleName='container'>
    <div onClick={handleFullscreen}>
      <Icon icon='FULLSCREEN' size={48} styleName='fullscreen' />
    </div>
  </div>
)

const handleFullscreen = () => {
  if (screenfull.enabled) {
    const el = document.getElementById('player-fs-container')
    screenfull.request(el)
  }
}

export default PlayerHeader
