import React from 'react'
import { NavLink } from 'react-router-dom'
import Button from 'components/Button'
import styles from './Navigation.css'

const Navigation = React.forwardRef((props, ref) => (
  <div className={`${styles.container} bg-blur`} ref={ref}>
    <NavLink to='/library' className={({ isActive }) => isActive ? styles.btnActive : styles.btn}>
      <Button
        animateClassName={styles.btnAnimate}
        className={styles.shadow}
        icon='NAV_LIBRARY'
        size={42}
      />
    </NavLink>
    <NavLink to='/queue' className={({ isActive }) => isActive ? styles.btnActive : styles.btn}>
      <Button
        animateClassName={styles.btnAnimate}
        className={styles.shadow}
        icon='NAV_SUBSCRIPTIONS'
        size={42}
      />
    </NavLink>
    <NavLink to='/account' className={({ isActive }) => isActive ? styles.btnActive : styles.btn}>
      <Button
        animateClassName={styles.btnAnimate}
        className={styles.shadow}
        icon='NAV_ACCOUNT'
        size={42}
      />
    </NavLink>
  </div>
))

Navigation.displayName = 'Navigation'

export default Navigation
