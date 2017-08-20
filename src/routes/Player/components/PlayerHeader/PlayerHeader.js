import PropTypes from 'prop-types'
import React from 'react'
import Header from 'components/Header'
import Icon from 'components/Icon'
import './PlayerHeader.css'

const PlayerHeader = (props) => (
  <Header>
    <div styleName='container'>
      <div onClick={props.requestFullscreen}>
        <Icon icon='FULLSCREEN' size={48} styleName='fullscreen' />
      </div>
    </div>
  </Header>
)

PlayerHeader.propTypes = {
  // actions
  requestFullscreen: PropTypes.func.isRequired,
}

export default PlayerHeader
