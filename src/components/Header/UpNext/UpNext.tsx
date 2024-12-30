import React from 'react'
import { formatSeconds } from 'lib/dateTime'
import styles from './UpNext.css'

interface UpNextProps {
  isUpNow: boolean
  isUpNext: boolean
  wait?: number
}

const UpNext = (props: UpNextProps) => {
  if (props.isUpNow) {
    return (
      <div className={styles.upNow}>
        <p className={styles.msg}>
          You&rsquo;re up
          {' '}
          <strong>now</strong>
        </p>
      </div>
    )
  }

  if (props.isUpNext) {
    return (
      <div className={styles.upNext}>
        <p className={styles.msg}>
          You&rsquo;re up
          {' '}
          <strong>next</strong>
          {props.wait ? ` in ${formatSeconds(props.wait, true)}` : ''}
        </p>
      </div>
    )
  }

  if (props.wait) {
    return (
      <div className={styles.inQueue}>
        <p className={styles.msg}>
          You&rsquo;re up in
          {' '}
          {formatSeconds(props.wait, true)}
        </p>
      </div>
    )
  }

  return null
}

export default UpNext
