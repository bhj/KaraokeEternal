import React from 'react'
import { NavLink } from 'react-router-dom'
import Icon from 'components/Icon'
import styles from './Navigation.css'

const Navigation = React.forwardRef((props, ref) => (
  <div className={`${styles.container} bg-blur`} ref={ref}>
    <NavLink to='/library' className={styles.btn} activeClassName={styles.btnActive}>
      <Icon icon='NAV_LIBRARY' size={42} className={styles.shadow}/>
    </NavLink>
    <NavLink to='/queue' className={styles.btn} activeClassName={styles.btnActive}>
      <Icon icon='NAV_SUBSCRIPTIONS' size={42} className={styles.shadow}/>
    </NavLink>
    <NavLink to='/account' className={styles.btn} activeClassName={styles.btnActive}>
      <Icon icon='NAV_ACCOUNT' size={42} className={styles.shadow}/>
    </NavLink>
  </div>
))

Navigation.displayName = 'Navigation'

export default Navigation
