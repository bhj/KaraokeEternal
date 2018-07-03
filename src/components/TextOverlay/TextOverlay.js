import PropTypes from 'prop-types'
import React from 'react'
import './TextOverlay.css'

export const TextOverlay = ({ children, ui }) => (
  <div styleName='container' style={{
    paddingTop: ui.headerHeight,
    paddingBottom: ui.footerHeight,
    width: ui.browserWidth,
    height: ui.browserHeight,
  }}>
    <div styleName='text'>
      {children}
    </div>
  </div>
)

export default TextOverlay

TextOverlay.propTypes = {
  children: PropTypes.node.isRequired,
  ui: PropTypes.object.isRequired,
}
