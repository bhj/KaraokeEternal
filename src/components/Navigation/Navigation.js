import React from 'react'
import { NavLink } from 'react-router-dom'
import Icon from 'components/Icon'
import styles from './Navigation.css'

const Navigation = React.forwardRef((props, ref) => (
  <div styleName='container' className='bg-blur' ref={ref}>
    <NavLink to='/library' styleName='styles.btn' activeClassName={styles.btnActive}>
      <Icon icon='NAV_LIBRARY' size={42} styleName='styles.shadow'/>
    </NavLink>
    <NavLink to='/queue' styleName='styles.btn' activeClassName={styles.btnActive}>
      <Icon icon='NAV_SUBSCRIPTIONS' size={42} styleName='styles.shadow'/>
    </NavLink>
    <NavLink to='/account' styleName='styles.btn' activeClassName={styles.btnActive}>
      <Icon icon='NAV_ACCOUNT' size={42} styleName='styles.shadow'/>
    </NavLink>
  </div>
))

Navigation.displayName = 'Navigation'

export default Navigation
