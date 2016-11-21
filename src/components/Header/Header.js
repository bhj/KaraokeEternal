import React from 'react'
import classes from './Header.css'

const Header = (props) => (
  <div>
    <h1 className={classes.title}>{props.title}</h1>
  </div>
)

export default Header
