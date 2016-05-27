import React from 'react'
import classes from './LibraryView.css'

export const LibraryView = ({ children }) => (
  <div className={classes.flexContainer + ' ' + classes.flexItem}>
    <p>Some search shit goes here</p>
    <div className={classes.flexItem}>
      {children}
    </div>
  </div>
)

export default LibraryView
