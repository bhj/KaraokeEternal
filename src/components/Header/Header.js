import React from 'react'
import classes from './Header.css'

export const Header = (props) => (
  <div className={classes.center}>
    <h1>{props.title}</h1>
  </div>
)

export default Header
