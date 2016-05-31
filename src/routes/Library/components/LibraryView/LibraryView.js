import React from 'react'
import Header from 'components/Header'
import classes from './LibraryView.css'

export const LibraryView = ({ children }) => (
  <div className={classes.flexContainer + ' ' + classes.flexItem}>
    <Header title="Artists"/>
    <p>Some search shit goes here</p>
    <div className={classes.flexItem}>
      {children}
    </div>
  </div>
)

export default LibraryView
