import React from 'react'
import { Link, IndexLink } from 'react-router'
import classes, {active} from './Navigation.css'

export const Navigation = (props) => (
  <div className={classes.flexContainer}>
    <Link to='/library' className={classes.flexItem+' '+classes.button} activeClassName={active}>
      <i className={'material-icons '+classes.icon}>library_music</i>
    </Link>
    <Link to='/player' className={classes.flexItem+' '+classes.button} activeClassName={active}>
      <i className={'material-icons '+classes.icon}>subscriptions</i>
    </Link>
    <Link to='/account' className={classes.flexItem+' '+classes.button} activeClassName={active}>
      <i className={'material-icons '+classes.icon}>person</i>
    </Link>
  </div>
)

export default Navigation
