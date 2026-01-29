import React, { useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { ensureState } from 'redux-optimistic-ui'
import QueueItem from '../QueueItem/QueueItem'
import { formatSeconds } from 'lib/dateTime'
import { moveItem, removeUpcomingItems } from '../../modules/queue'
import getPlayerHistory from '../../selectors/getPlayerHistory'
import getRoundRobinQueue from '../../selectors/getRoundRobinQueue'
import getWaits from '../../selectors/getWaits'
import styles from './QueueList.css'

const QueueList = () => {
  const artists = useAppSelector(state => state.artists)
  const { errorMessage, isAtQueueEnd, isErrored, isPlaying, position, queueId } = useAppSelector(state => state.status)

  const playerHistory = useAppSelector(getPlayerHistory)
  const queue = useAppSelector(getRoundRobinQueue)
  const songs = useAppSelector(state => state.songs)
  const starredSongs = useAppSelector(state => ensureState(state.userStars).starredSongs)
  const user = useAppSelector(state => state.user)
  const waits = useAppSelector(getWaits)

  const dispatch = useAppDispatch()

  const handleMoveClick = useCallback((qId: number) => {
    const userId = queue.entities[qId].userId
    let lastPlayed = queueId

    for (let i = queue.result.indexOf(queueId); i >= 0; i--) {
      if (queue.entities[queue.result[i]].userId === userId) {
        lastPlayed = queue.result[i]
        break
      }
    }

    dispatch(moveItem({ queueId: qId, prevQueueId: lastPlayed }))
  }, [dispatch, queueId, queue.entities, queue.result])

  const handleRemoveUpcoming = useCallback((userId: number) => {
    dispatch(removeUpcomingItems(userId))
  }, [dispatch])

  // Drag & Drop handler (admin only)
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination || !user.isAdmin) return
    if (result.source.index === result.destination.index) return

    const sourceQueueId = queue.result[result.source.index]
    const destIndex = result.destination.index

    // Find the prevQueueId for the destination
    // If moving to position 0, prevQueueId is -1 (null in server)
    // Otherwise, prevQueueId is the item before the destination
    let prevQueueId: number
    if (destIndex === 0) {
      prevQueueId = -1
    } else if (destIndex > result.source.index) {
      // Moving down - prevQueueId is the item at destIndex
      prevQueueId = queue.result[destIndex]
    } else {
      // Moving up - prevQueueId is the item before destIndex
      prevQueueId = queue.result[destIndex - 1]
    }

    dispatch(moveItem({ queueId: sourceQueueId, prevQueueId }))
  }, [dispatch, queue.result, user.isAdmin])

  // Build items with drag info
  const items = queue.result.map((qId, index) => {
    const item = queue.entities[qId]
    const duration = songs.entities[item.songId].duration
    const isCurrent = (qId === queueId) && !isAtQueueEnd
    const isUpcoming = qId !== queueId && !playerHistory.includes(qId)
    const isOwner = item.userId === user.userId
    // Only admins can drag, and only upcoming items
    const isDraggable = user.isAdmin && isUpcoming

    return (
      <Draggable
        key={qId}
        draggableId={String(qId)}
        index={index}
        isDragDisabled={!isDraggable}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={snapshot.isDragging ? styles.dragging : ''}
          >
            <QueueItem
              {...item}
              artist={artists.entities[songs.entities[item.songId].artistId].name}
              errorMessage={isCurrent && errorMessage ? errorMessage : ''}
              isCurrent={isCurrent}
              isErrored={isCurrent && isErrored}
              isInfoable={user.isAdmin}
              isMovable={isUpcoming && (isOwner || user.isAdmin)}
              isOwner={isOwner}
              isPlayed={!isUpcoming && !isCurrent}
              isPlaying={isCurrent && isPlaying}
              isRemovable={isUpcoming && (isOwner || user.isAdmin)}
              isReplayable={(!isUpcoming || isCurrent) && user.isAdmin}
              isSkippable={isCurrent && (isOwner || user.isAdmin)}
              isStarred={starredSongs.includes(item.songId)}
              isUpcoming={isUpcoming}
              pctPlayed={isCurrent ? position / duration * 100 : 0}
              title={songs.entities[item.songId].title}
              wait={formatSeconds(waits[qId], true)}
              onMoveClick={handleMoveClick}
              onRemoveUpcoming={handleRemoveUpcoming}
            />
          </div>
        )}
      </Draggable>
    )
  })

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="queue-list">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={styles.container}
          >
            {items}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}

export default QueueList
