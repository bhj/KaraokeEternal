import React from 'react'
import { Link, IndexLink } from 'react-router'
import classes, {active} from './Navigation.css'

export const Navigation = (props) => (
  <div className={classes.flexContainer}>
    <Link to='/library' className={classes.flexItem+' '+classes.button} activeClassName={active}>
      <i className="fa fa-book fa-3x" aria-hidden="true"></i>
    </Link>
    <Link to='/player' className={classes.flexItem+' '+classes.button} activeClassName={active}>
      <i className="fa fa-list-ol fa-3x" aria-hidden="true"></i>
    </Link>
    <Link to='/account' className={classes.flexItem+' '+classes.button} activeClassName={active}>
      <i className="fa fa-user fa-3x" aria-hidden="true"></i>
    </Link>
  </div>
)

export default Navigation
