import React from 'react'
import { Link } from 'react-router'
import styles from './NoPlayer.css'

const NoPlayer = () => (
  <div className={styles.container}>
    <p className={styles.msg}>
      No player in room (
      <Link to='/player' target='_blank' replace>Launch Player</Link>
      )
    </p>
  </div>
)

export default NoPlayer
