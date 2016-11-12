import React from 'react'
import './CoreLayout.scss'
import '../../styles/core.scss'
import '../../styles/nomodule/material-ui.scss'

export const CoreLayout = ({ children }) => {
    return (
      <div style={{height: '100%'}}>
        {children}
      </div>
    )
}

CoreLayout.propTypes = {
  children : React.PropTypes.element
}

export default CoreLayout
