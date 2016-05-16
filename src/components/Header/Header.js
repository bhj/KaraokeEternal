import React from 'react'
import { IndexLink, Link } from 'react-router'
import classes from './Header.scss'

export const Header = () => (
  <div>
    <h1>React Redux Starter Kit</h1>
    <IndexLink to='/' activeClassName={classes.activeRoute}>
      Home
    </IndexLink>
    {' · '}
    <Link to='/counter' activeClassName={classes.activeRoute}>
      Counter
    </Link>
    {' · '}
    <Link to='/player' activeClassName={classes.activeRoute}>
      Player
    </Link>
    {' · '}
    <Link to='/account' activeClassName={classes.activeRoute}>
      Account
    </Link>
  </div>
)

export default Header
