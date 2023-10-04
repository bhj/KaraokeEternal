import React from 'react'
import styles from './TextOverlay.css'

interface TextOverlayProps {
  children: React.ReactNode
  className?: string
}

export const TextOverlay = (props: TextOverlayProps) => (
  <div className={styles.container}>
    <div className={`${styles.text} ${props.className}`}>
      {props.children}
    </div>
  </div>
)

export default TextOverlay
