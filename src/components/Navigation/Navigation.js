import PropTypes from 'prop-types'
import React from 'react'
import Measure from 'react-measure'
import { Link } from 'react-router'
import Icon from 'components/Icon'
import styles from './Navigation.css'

export const Navigation = (props) => (
  <Measure onMeasure={props.setFooterHeight} whitelist={['height']}>
    <div styleName='container' className='bg-blur'>
      <Link to='/library' styleName='styles.btn' activeClassName={styles.btnActive}>
        <Icon icon='NAV_LIBRARY' size={42}/>
      </Link>
      <Link to='/queue' styleName='styles.btn' activeClassName={styles.btnActive}>
        <Icon icon='NAV_SUBSCRIPTIONS' size={42}/>
      </Link>
      <Link to='/account' styleName='styles.btn' activeClassName={styles.btnActive}>
        <Icon icon='NAV_ACCOUNT' size={42}/>
      </Link>
    </div>
  </Measure>
)

Navigation.propTypes = {
  loc: PropTypes.string.isRequired,
  setFooterHeight: PropTypes.func.isRequired,
}

export default Navigation
