import React from 'react'
import PathPrefs from './PathPrefs'
import PlayerPrefs from './PlayerPrefs'
import YouTubePrefs from './YouTubePrefs'
import styles from './Prefs.css'

const Prefs = props => (
  <div className={styles.container}>
    <h1 className={styles.title}>Preferences</h1>
    <div className={styles.content}>
      <PathPrefs />
      <YouTubePrefs />
      <PlayerPrefs />
    </div>
  </div>
)

export default Prefs
