import React from 'react'
import clsx from 'clsx'
import styles from './Logo.css'

interface LogoProps {
  className?: string
}

const Logo = (props: LogoProps) => {
  return (
    <div className={clsx(styles.container, props.className)} role='img' aria-label='Karaoke Eternal'>
      <span className={styles.title} aria-hidden='true'>
        Karaoke
        <span className={styles.eternal}>
          Eterna
          <span className={styles.lastChar}>l</span>
        </span>
      </span>
    </div>
  )
}

export default Logo
