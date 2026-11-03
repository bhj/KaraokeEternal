import React, { useState } from 'react'
import Button from 'components/Button/Button'
import styles from './ProgressBar.css'

interface ProgressBarProps {
  isActive: boolean
  onCancel: () => void
  pct: number
  text: string
}

const ProgressBar = ({ isActive, onCancel, pct, text }: ProgressBarProps) => {
  const [canceling, setCanceling] = useState(false)
  const [visible, setVisible] = useState(false)
  const [prevActive, setPrevActive] = useState(isActive)
  const [prevText, setPrevText] = useState(text)

  if (isActive !== prevActive || text !== prevText) {
    setPrevActive(isActive)
    setPrevText(text)

    if (isActive && !prevActive) {
      setVisible(true)
      setCanceling(false)
    } else if (canceling && text !== prevText) {
      // only show 'Stopping...' until the next update
      setCanceling(false)
    }
  }

  const handleCancelClick = () => {
    if (isActive && !canceling) {
      setCanceling(true)
      onCancel()
    } else {
      setVisible(false)
    }
  }

  if (!visible) return null

  return (
    <div className={styles.container} style={{ backgroundSize: pct + '% 100%' }}>
      <p className={styles.text}>{canceling ? 'Stopping...' : text}</p>
      <Button
        className={isActive ? styles.cancel : styles.close}
        icon='CLEAR'
        onClick={handleCancelClick}
        size={40}
        aria-label={isActive ? 'Cancel' : 'Close'}
      />
    </div>
  )
}

export default ProgressBar
