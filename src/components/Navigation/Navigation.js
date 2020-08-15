import PropTypes from 'prop-types'
import React from 'react'
import { Link } from 'react-router'
import Icon from 'components/Icon'
import styles from './Navigation.css'

const Navigation = React.forwardRef((props, ref) => (
  <div styleName='container' className='bg-blur' ref={ref}>
    <Link to='/library' styleName='styles.btn' activeClassName={styles.btnActive}>
      <Icon icon='NAV_LIBRARY' size={42} styleName='styles.shadow'/>
    </Link>
    <Link to='/queue' styleName='styles.btn' activeClassName={styles.btnActive}>
      <Icon icon='NAV_SUBSCRIPTIONS' size={42} styleName='styles.shadow'/>
    </Link>
    <Link to='/account' styleName='styles.btn' activeClassName={styles.btnActive}>
      <Icon icon='NAV_ACCOUNT' size={42} styleName='styles.shadow'/>
    </Link>
  </div>
))

Navigation.displayName = 'Navigation'
Navigation.propTypes = {
  loc: PropTypes.string.isRequired,
}

export default Navigation
