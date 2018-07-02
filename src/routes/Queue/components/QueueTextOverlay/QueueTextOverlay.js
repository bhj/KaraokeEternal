import PropTypes from 'prop-types'
import React from 'react'
import './QueueTextOverlay.css'

export const QueueTextOverlay = ({ children, ui }) => (
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

export default QueueTextOverlay

QueueTextOverlay.propTypes = {
  children: PropTypes.node.isRequired,
  ui: PropTypes.object.isRequired,
}
