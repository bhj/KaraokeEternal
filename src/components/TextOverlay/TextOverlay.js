import PropTypes from 'prop-types'
import React from 'react'
import './TextOverlay.css'

export const TextOverlay = ({ children }) => (
  <div styleName='container'>
    <div styleName='text'>
      {children}
    </div>
  </div>
)

export default TextOverlay

TextOverlay.propTypes = {
  children: PropTypes.node.isRequired,
}
