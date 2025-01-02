import React, { useEffect, useRef } from 'react'
import { useAppSelector } from 'store/hooks'
import { ensureState } from 'redux-optimistic-ui'
import { Link } from 'react-router-dom'
import getRoundRobinQueue from '../selectors/getRoundRobinQueue'
import QueueList from '../components/QueueList/QueueList'
import Spinner from 'components/Spinner/Spinner'
import TextOverlay from 'components/TextOverlay/TextOverlay'
import styles from './QueueView.css'

const QUEUE_ITEM_HEIGHT = 92

const QueueView = () => {
  const { innerWidth, innerHeight, headerHeight, footerHeight } = useAppSelector(state => state.ui)
  const isInRoom = useAppSelector(state => !!state.user.roomId)
  const isLoading = useAppSelector(state => ensureState(state.queue).isLoading)
  const queue = useAppSelector(getRoundRobinQueue)
  const queueId = useAppSelector(state => state.status.queueId)
  const containerRef = useRef<HTMLDivElement>(null)

  // ensure current song is in view on first mount only
  useEffect(() => {
    if (containerRef.current) {
      const i = queue.result.indexOf(queueId)
      containerRef.current.scrollTop = QUEUE_ITEM_HEIGHT * i
    }
  }, [queue.result, queueId])

  return (
    <div
      className={styles.container}
      ref={containerRef}
      style={{
        paddingTop: headerHeight,
        paddingBottom: footerHeight,
        width: innerWidth,
        height: innerHeight,
      }}
    >
      {!isInRoom && (
        <TextOverlay>
          <h1>Get a Room!</h1>
          <p>
            <Link to='/account'>Sign in to a room</Link>
            {' '}
            to start queueing songs.
          </p>
        </TextOverlay>
      )}

      {isLoading && <Spinner />}

      {!isLoading && queue.result.length === 0 && (
        <TextOverlay>
          <h1>Queue Empty</h1>
          <p>
            Tap a song in the
            <Link to='/library'>library</Link>
            {' '}
            to queue it.
          </p>
        </TextOverlay>
      )}

      <QueueList />
    </div>
  )
}

export default QueueView
