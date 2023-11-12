import React from 'react'
import styles from './Spinner.css'

const Spinner = () => (
  <div className={styles.container}>
    <div className={styles.spinner}></div>
    <div className={`${styles.spinner} ${styles.rect2}`}></div>
    <div className={`${styles.spinner} ${styles.rect3}`}></div>
    <div className={`${styles.spinner} ${styles.rect4}`}></div>
    <div className={`${styles.spinner} ${styles.rect5}`}></div>
  </div>
)

export default Spinner
