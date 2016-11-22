import React from 'react'
import { Link, IndexLink } from 'react-router'
import classes, {active} from './Navigation.css'

export const Navigation = (props) => (
  <div className={classes.container}>
    <Link to='/library' className={classes.button} activeClassName={active}>
      <i className={'material-icons '+classes.icon}>library_music</i>
    </Link>
    <Link to='/queue' className={classes.button} activeClassName={active}>
      <i className={'material-icons '+classes.icon}>subscriptions</i>
    </Link>
    <Link to='/account' className={classes.button} activeClassName={active}>
      <i className={'material-icons '+classes.icon}>mood</i>
    </Link>
  </div>
)

export default Navigation
