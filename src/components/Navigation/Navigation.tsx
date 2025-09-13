import React from 'react'
import clsx from 'clsx'
import { NavLink } from 'react-router'
import Button from 'components/Button/Button'
import styles from './Navigation.css'

const Navigation = React.forwardRef<HTMLDivElement>((_, ref) => (
  <div className={clsx(styles.container, 'bg-blur')} ref={ref}>
    <NavLink to='/library' replace className={({ isActive }) => clsx(isActive && styles.active)}>
      <Button
        icon='NAV_LIBRARY'
        as='span'
        animateClassName={styles.btnAnimate}
      />
    </NavLink>
    <NavLink to='/queue' replace className={({ isActive }) => clsx(isActive && styles.active)}>
      <Button
        icon='NAV_SUBSCRIPTIONS'
        as='span'
        animateClassName={styles.btnAnimate}
      />
    </NavLink>
    <NavLink to='/account' replace className={({ isActive }) => clsx(isActive && styles.active)}>
      <Button
        icon='NAV_ACCOUNT'
        as='span'
        animateClassName={styles.btnAnimate}
      />
    </NavLink>
  </div>
))

Navigation.displayName = 'Navigation'

export default Navigation
