import React from 'react'
import './Header.scss'

export const Header = (props) => (
  <div className={classes.container}>
    {props.children}
  </div>
)

export const HeaderTitle = (props) => (
  <h1 className={classes.title}>
    {props.children}
  </h1>
)
