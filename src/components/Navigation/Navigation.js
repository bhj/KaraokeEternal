import React, { PropTypes } from 'react'
import Measure from 'react-measure'
import { Link } from 'react-router'
import classes, { active } from './Navigation.css'

export const Navigation = (props) => (
  <Measure onMeasure={props.setFooterHeight} whitelist={['height']}>
    <div className={classes.container}>
      <Link to='/library' className={classes.button} activeClassName={active}>
        <i className='material-icons'>library_music</i>
      </Link>
      <Link to='/queue' className={classes.button} activeClassName={active}>
        <i className='material-icons'>subscriptions</i>
      </Link>
      <Link to='/account' className={classes.button} activeClassName={active}>
        <i className='material-icons'>mood</i>
      </Link>
    </div>
  </Measure>
)

Navigation.propTypes = {
  setFooterHeight: PropTypes.func,
}

export default Navigation
