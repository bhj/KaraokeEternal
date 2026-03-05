import React, { useEffect, useState } from 'react'
import clsx from 'clsx'
import styles from './Logo.css'

interface LogoProps {
  className?: string
}

const Logo = (props: LogoProps) => {
  const [isFontLoaded, setIsFontLoaded] = useState(() => {
    // if the font loading API is not supported, we can't wait for it
    return typeof document !== 'undefined' && !document.fonts
  })

  useEffect(() => {
    if (document.fonts) {
      document.fonts.load('1em Beon')
        .then(() => {
          setIsFontLoaded(true)
          return true
        })
        .catch(() => {
          setIsFontLoaded(true)
          return false
        })
    }
  }, [])

  return (
    <div className={clsx(styles.container, props.className)} role='img' aria-label='Karaoke Chasidi'>
      <span className={styles.title} aria-hidden='true'>
        Karaoke
        <span className={clsx(styles.eternal, { [styles.eternalVisible]: isFontLoaded })}>
          Chasid
          <span className={styles.lastChar}>i</span>
        </span>
      </span>
    </div>
  )
}

export default Logo
