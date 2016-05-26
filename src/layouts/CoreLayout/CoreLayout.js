import React from 'react'
import Header from '../../components/Header'
import '../../styles/core.scss'
import classes from './CoreLayout.css'

export const CoreLayout = ({ children }) => (
  <div className={classes.flexContainer}>
    <Header />
    <div className={classes.flexBody}>
      {children}
    </div>
  </div>
)

CoreLayout.propTypes = {
  children: React.PropTypes.element.isRequired
}

export default CoreLayout
