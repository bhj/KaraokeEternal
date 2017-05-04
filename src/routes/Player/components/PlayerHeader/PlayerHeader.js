import PropTypes from 'prop-types'
import React from 'react'
import Header from 'components/Header'
import './PlayerHeader.css'

const PlayerHeader = (props) => (
  <Header>
    <div styleName='container'>
      <div onClick={props.requestFullscreen}>
        <i className='material-icons'>fullscreen</i>
      </div>
    </div>
  </Header>
)

PlayerHeader.propTypes = {
  // actions
  requestFullscreen: PropTypes.func.isRequired,
}

export default PlayerHeader
