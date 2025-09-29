import React, { useState, useEffect, useRef } from 'react'
import { CSSTransition } from 'react-transition-group'
import UserImage from 'components/UserImage/UserImage'
import type { QueueItem } from 'shared/types'
import styles from './UpNow.css'

interface UpNowProps {
  queueItem: QueueItem
}

const UpNow = ({ queueItem }: UpNowProps) => {
  const [show, setShow] = useState(false)
  const timeoutID = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nodeRef = useRef<HTMLDivElement | null>(null)

  const animate = () => {
    if (timeoutID.current) {
      clearTimeout(timeoutID.current)
    }

    setShow(true)

    timeoutID.current = setTimeout(() => {
      setShow(false)
    }, 5000)
  }

  useEffect(() => {
    animate()

    // Cleanup when component unmounts
    return () => {
      if (timeoutID.current) {
        clearTimeout(timeoutID.current)
      }
    }
  }, [])

  useEffect(() => {
    animate()

    // Cleanup the timeout when queueItem changes
    return () => {
      if (timeoutID.current) {
        clearTimeout(timeoutID.current)
      }
    }
  }, [queueItem.queueId])

  return (
    <CSSTransition
      nodeRef={nodeRef}
      in={show}
      timeout={500}
      classNames={{
        enterActive: styles.enterActive,
        enterDone: styles.enterDone,
        exitActive: styles.exitActive,
      }}
    >
      <div ref={nodeRef} className={styles.container}>
        <div className={styles.innerContainer}>
          <UserImage
            userId={queueItem.userId}
            dateUpdated={queueItem.userDateUpdated}
            className={styles.userImage}
          />
          <div className={styles.user}>
            {queueItem.userDisplayName}
          </div>
        </div>
      </div>
    </CSSTransition>
  )
}

export default UpNow
