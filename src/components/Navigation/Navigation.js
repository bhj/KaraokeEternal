import React from 'react'
import { NavLink } from 'react-router-dom'
import Icon from 'components/Icon'
import styles from './Navigation.css'
import { connect, useDispatch } from 'react-redux'
import { logout } from '../../store/modules/user'
import { isPublicDevice } from '../../routes/Library/components/SongList/SongList'

const Navigation = React.forwardRef((props, ref) => {
  const showIconTitles = true
  const dispatch = useDispatch()

  return (
    <div className={`${styles.container} bg-blur`} ref={ref}>
      <NavLink to='/library' className={styles.btn} activeClassName={styles.btnActive}>
        <Icon icon='NAV_LIBRARY' size={42} className={styles.shadow}/>
        {showIconTitles && (
          <div>
            Library
          </div>
        )}
      </NavLink>
      <NavLink to='/queue' className={styles.btn} activeClassName={styles.btnActive}>
        <Icon icon='NAV_SUBSCRIPTIONS' size={42} className={styles.shadow}/>
        {showIconTitles && (
          <div>
            Queue
          </div>
        )}
      </NavLink>
      <NavLink to='/account' className={styles.btn} activeClassName={styles.btnActive}>
        <Icon icon='NAV_ACCOUNT' size={42} className={styles.shadow}/>
        {showIconTitles && (
          <div>
            {props.username ? (
              <>
                {props.username} ({props.userDisplayName})
                {isPublicDevice && (
                  <div>
                    <a
                      onClick={e => {
                        e.preventDefault()
                        dispatch(logout())
                      }}
                      style={{
                        color: 'orange',
                      }}
                    >Sign Out</a>
                  </div>
                )}
              </>
            ) : (
              'User'
            )}
          </div>
        )}
      </NavLink>
    </div>
  )
})

Navigation.displayName = 'Navigation'

export default connect(state => ({
  username: state.user.username,
  userDisplayName: state.user.name,
}), null, null, { forwardRef: true })(Navigation)
