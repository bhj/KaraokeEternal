import React from 'react'
import Header from '../../components/Header'
import classes from './CoreLayout.css'

export const CoreLayout = ({ children }) => (
  <div className={classes.flexContainer}>
    <Header />
    <div className={classes.flexContent}>
      {children}
    </div>
    <Header />
  </div>
)

CoreLayout.propTypes = {
  children: React.PropTypes.element.isRequired
}

export default CoreLayout
