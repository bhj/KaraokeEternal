import PropTypes from 'prop-types'
import React from 'react'
import './TextOverlay.css'

export const TextOverlay = props => (
  <div styleName='container'>
    <div styleName='text' className={props.className}>
      {props.children}
    </div>
  </div>
)

export default TextOverlay

TextOverlay.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}
