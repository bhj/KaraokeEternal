import React from 'react'
import Navigation from '../../components/Navigation'
import classes from './CoreLayout.css'
import '../../styles/core.scss'
import '../../styles/nomodule/material-ui.scss';

export const CoreLayout = ({ children }) => (
  <div style={{height: '100%'}} className={classes.flexContainer}>
    <div className={classes.flexContainer + ' ' + classes.flexItem}>
      {children}
    </div>
    <Navigation />
  </div>
)

CoreLayout.propTypes = {
  children: React.PropTypes.element.isRequired
}

export default CoreLayout
