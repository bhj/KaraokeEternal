import PropTypes from 'prop-types'
import React from 'react'
import Measure from 'react-measure'
import { Link } from 'react-router'
import styles from './Navigation.css'

export const Navigation = (props) => (
  <Measure onMeasure={props.setFooterHeight} whitelist={['height']}>
    <div styleName='container' className='bg-blur'>
      <Link to='/library' styleName='styles.button' activeClassName={styles.active}>
        <i className='material-icons'>library_music</i>
      </Link>
      <Link to='/queue' styleName='styles.button' activeClassName={styles.active}>
        <i className='material-icons'>subscriptions</i>
      </Link>
      <Link to='/account' styleName='styles.button' activeClassName={styles.active}>
        <i className='material-icons'>mood</i>
      </Link>
    </div>
  </Measure>
)

Navigation.propTypes = {
  setFooterHeight: PropTypes.func,
}

export default Navigation
