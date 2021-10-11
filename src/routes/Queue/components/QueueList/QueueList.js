import React, { useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import QueueItem from '../QueueItem'
import { formatSeconds } from 'lib/dateTime'
import { CSSTransition, TransitionGroup } from 'react-transition-group'

import getPlayerHistory from '../../selectors/getPlayerHistory'
import getOrderedQueue from '../../selectors/getOrderedQueue'
import getWaits from '../../selectors/getWaits'

import styles from './QueueList.css'
const QUEUE_ITEM_HEIGHT = 92

const QueueList = props => {
  const containerRef = useRef()

  const artists = useSelector(state => state.artists)
  const { errorMessage, isAtQueueEnd, isErrored, position, queueId } = useSelector(state => state.status)

  const playerHistory = useSelector(getPlayerHistory)
  const queue = useSelector(getOrderedQueue)
  const songs = useSelector(state => state.songs)
  const starredSongs = useSelector(state => ensureState(state.userStars).starredSongs)
  const user = useSelector(state => state.user)
  const waits = useSelector(getWaits)

  // ensure current song is visible
  useEffect(() => {
    if (containerRef.current) {
      const i = queue.result.indexOf(queueId)
      containerRef.current.parentNode.scrollTop = QUEUE_ITEM_HEIGHT * i
    }
  }, [queue.result, queueId])

  // build children array
  const items = queue.result.map(qId => {
    const item = queue.entities[qId]

    if (item.isOptimistic ||
        !songs.entities[item.songId] ||
        !artists.entities[songs.entities[item.songId].artistId]) return null

    const duration = songs.entities[item.songId].duration
    const isCurrent = (qId === queueId) && !isAtQueueEnd
    const isUpcoming = qId !== queueId && !playerHistory.includes(qId)
    const isOwner = item.userId === user.userId

    return (
      <CSSTransition
        key={qId}
        timeout={800}
        unmountOnExit={false}
        classNames={{
          appear: '',
          appearActive: '',
          enter: styles.fadeEnter,
          enterActive: styles.fadeEnterActive,
          exit: styles.itemExit,
          exitActive: styles.itemExitActive,
        }}
      >
        <QueueItem {...item}
          artist={artists.entities[songs.entities[item.songId].artistId].name}
          errorMessage={isCurrent && errorMessage ? errorMessage : ''}
          isCurrent={isCurrent}
          isErrored={isCurrent && isErrored}
          isInfoable={user.isAdmin}
          isOwner={isOwner}
          isPlayed={!isUpcoming && !isCurrent}
          isRemovable={isUpcoming && (isOwner || user.isAdmin)}
          isSkippable={isCurrent && (isOwner || user.isAdmin)}
          isStarred={starredSongs.includes(item.songId)}
          isUpcoming={isUpcoming}
          pctPlayed={isCurrent ? position / duration * 100 : 0}
          title={songs.entities[item.songId].title}
          wait={formatSeconds(waits[qId], true)} // fuzzy
        />
      </CSSTransition>
    )
  })

  return (
    <div ref={containerRef}>
      <TransitionGroup component={null}>
        {items}
      </TransitionGroup>
    </div>
  )
}

export default QueueList
