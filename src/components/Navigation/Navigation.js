import PropTypes from 'prop-types'
import React from 'react'
import Measure from 'react-measure'
import { Link } from 'react-router'
import Icon from 'components/icon'
import styles from './Navigation.css'

export const Navigation = (props) => (
  <Measure onMeasure={props.setFooterHeight} whitelist={['height']}>
    <div styleName='container' className='bg-blur'>
      <Link to='/library' styleName='styles.button' activeClassName={styles.activeButton}>
        <Icon icon='NAV_LIBRARY' size={48} styleName={props.loc === '/library' ? 'activeIcon' : 'icon'} />
      </Link>
      <Link to='/queue' styleName='styles.button' activeClassName={styles.activeButton}>
        <Icon icon='NAV_SUBSCRIPTIONS' size={48} styleName={props.loc === '/queue' ? 'activeIcon' : 'icon'} />
      </Link>
      <Link to='/account' styleName='styles.button' activeClassName={styles.activeButton}>
        <Icon icon='NAV_ACCOUNT' size={48} styleName={props.loc === '/account' ? 'activeIcon' : 'icon'} />
      </Link>
    </div>
  </Measure>
)

Navigation.propTypes = {
  loc: PropTypes.string.isRequired,
  setFooterHeight: PropTypes.func.isRequired,
}

export default Navigation
