import React from 'react'
import clsx from 'clsx'
import { NavLink } from 'react-router'
import Button from 'components/Button/Button'
import styles from './Navigation.css'

const Navigation = React.forwardRef<HTMLDivElement>((_, ref) => (
  <div className={clsx(styles.container, 'bg-blur')} ref={ref}>
    <NavLink to='/library' replace className={({ isActive }) => clsx(isActive && styles.active)}>
      {({ isActive }) => (
        <Button
          icon='NAV_LIBRARY'
          as='span'
          animateClassName={styles.btnAnimate}
          cancelAnimation={!isActive}
        />
      )}
    </NavLink>
    <NavLink to='/queue' replace className={({ isActive }) => clsx(isActive && styles.active)}>
      {({ isActive }) => (
        <Button
          icon='NAV_SUBSCRIPTIONS'
          as='span'
          animateClassName={styles.btnAnimate}
          cancelAnimation={!isActive}
        />
      )}
    </NavLink>
    <NavLink to='/account' replace className={({ isActive }) => clsx(isActive && styles.active)}>
      {({ isActive }) => (
        <Button
          icon={isActive ? 'NAV_ACCOUNT_ACTIVE' : 'NAV_ACCOUNT'}
          as='span'
          animateClassName={styles.btnAnimate}
          cancelAnimation={!isActive}
        />
      )}
    </NavLink>
  </div>
))

Navigation.displayName = 'Navigation'

export default Navigation
