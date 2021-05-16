import React from 'react'
import { Link } from 'react-router-dom'
import styles from './NoPlayer.css'

const NoPlayer = (props) => (
  <div className={styles.container}>
    <p className={styles.msg}>
      No player in room (<Link to='/player'>Start Player</Link>)
    </p>
  </div>
)

export default NoPlayer
