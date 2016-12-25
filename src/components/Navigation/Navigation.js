import React from 'react'
import Measure from 'react-measure'
import { Link, IndexLink } from 'react-router'
import classes, {active} from './Navigation.css'

export const Navigation = (props) => (
  <Measure onMeasure={props.onHeight} whitelist={['height']}>
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
  </Measure>

)

Navigation.PropTypes = {
  onHeight: React.PropTypes.func,
}

export default Navigation
