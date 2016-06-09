import React from 'react'
import classes from './Header.css'

export const Header = (props) => (
  <div className={classes.container}>
    <h1 className={classes.title}>{props.title}</h1>
  </div>
)

export default Header
