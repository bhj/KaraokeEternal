import React, { useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import QueueItem from '../QueueItem'
import { formatSeconds } from 'lib/dateTime'
import { CSSTransition, TransitionGroup } from 'react-transition-group'

import { moveItem } from '../../modules/queue'

import getPlayerHistory from '../../selectors/getPlayerHistory'
import getRoundRobinQueue from '../../selectors/getRoundRobinQueue'
import getWaits from '../../selectors/getWaits'

import styles from './QueueList.css'
const QUEUE_ITEM_HEIGHT = 92

const QueueList = props => {
  const containerRef = useRef()

  const artists = useSelector(state => state.artists)
  const { errorMessage, isAtQueueEnd, isErrored, position, queueId } = useSelector(state => state.status)

  const playerHistory = useSelector(getPlayerHistory)
  const queue = useSelector(getRoundRobinQueue)
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

  // actions
  const dispatch = useDispatch()
  const handleMoveClick = useCallback(qId => {
    // reference user's last-played item as the new prevQueueId
    const userId = queue.entities[qId].userId
    let lastPlayed = queueId // default in case user has no played items

    for (let i = queue.result.indexOf(queueId); i >= 0; i--) {
      if (queue.entities[queue.result[i]].userId === userId) {
        lastPlayed = queue.result[i]
        break
      }
    }

    dispatch(moveItem(qId, lastPlayed))
  }, [dispatch, queueId, queue.entities, queue.result])

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
          isMovable={isUpcoming && (isOwner || user.isAdmin)}
          isOwner={isOwner}
          isPlayed={!isUpcoming && !isCurrent}
          isRemovable={isUpcoming && (isOwner || user.isAdmin)}
          isSkippable={isCurrent && (isOwner || user.isAdmin)}
          isStarred={starredSongs.includes(item.songId)}
          isUpcoming={isUpcoming}
          pctPlayed={isCurrent ? position / duration * 100 : 0}
          title={songs.entities[item.songId].title}
          wait={formatSeconds(waits[qId], true)} // fuzzy
          // actions
          onMoveClick={handleMoveClick}
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
