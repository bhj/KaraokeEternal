import PropTypes from 'prop-types'
import React from 'react'
import './CoreLayout.scss'
import 'styles/core.scss'
import 'styles/material-icons.scss'

export const CoreLayout = ({ children }) => {
  return (
    <div style={{ height: '100%' }}>
      {children}
    </div>
  )
}

export default CoreLayout

CoreLayout.propTypes = {
  children: PropTypes.node,
}
