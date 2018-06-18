import PropTypes from 'prop-types'
import React from 'react'
import HeaderPortal from 'components/HeaderPortal'
import Icon from 'components/Icon'
import './PlayerHeader.css'

const PlayerHeader = (props) => (
  <HeaderPortal>
    <div styleName='container'>
      <div onClick={props.requestFullscreen}>
        <Icon icon='FULLSCREEN' size={48} styleName='fullscreen' />
      </div>
    </div>
  </HeaderPortal>
)

PlayerHeader.propTypes = {
  // actions
  requestFullscreen: PropTypes.func.isRequired,
}

export default PlayerHeader
