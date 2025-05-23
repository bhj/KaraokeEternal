import React from 'react'
import clsx from 'clsx'
import styles from './Logo.css'

interface LogoProps {
  className?: string
}

const Logo = (props: LogoProps) => {
  return (
    <div className={clsx(styles.container, props.className)}>
      <h1 className={styles.title}>
        Karaoke
        <span className={styles.eternal}>
          Eterna
          <span className={styles.lastChar}>l</span>
        </span>
      </h1>
    </div>
  )
}

export default Logo
