import React from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { ensureState } from 'redux-optimistic-ui'
import QueueItem from '../QueueItem/QueueItem'
import QueueListAnimator from '../QueueListAnimator/QueueListAnimator'
import { formatSeconds } from 'lib/dateTime'
import { moveItem, removeUpcomingItems } from '../../modules/queue'
import getPlayerHistory from '../../selectors/getPlayerHistory'
import getRoundRobinQueue from '../../selectors/getRoundRobinQueue'
import getWaits from '../../selectors/getWaits'

const QueueList = () => {
  const artists = useAppSelector(state => state.artists)
  const { errorMessage, isAtQueueEnd, isErrored, isPlaying, position, queueId } = useAppSelector(state => state.status)

  const playerHistory = useAppSelector(getPlayerHistory)
  const queue = useAppSelector(getRoundRobinQueue)
  const realQueue = useAppSelector(state => ensureState(state.queue))
  const songs = useAppSelector(state => state.songs)
  const starredSongs = useAppSelector(state => ensureState(state.userStars).starredSongs)
  const starCounts = useAppSelector(state => state.starCounts)
  const user = useAppSelector(state => state.user)
  const waits = useAppSelector(getWaits)

  const canManageRoom = user.isAdmin || user.role === 'room_manager'

  // actions
  const dispatch = useAppDispatch()
  const handleMoveClick = (qId: number) => {
    const userId = queue.entities[qId].userId

    if (canManageRoom) {
      // Admins and room managers have full reorder control: move the item to
      // just after the song's owner last appeared in the played history, which
      // effectively promotes it to the front of that user's upcoming turn.
      let lastPlayed = queueId // fallback: after currently playing

      for (let i = queue.result.indexOf(queueId); i >= 0; i--) {
        if (queue.entities[queue.result[i]].userId === userId) {
          lastPlayed = queue.result[i]
          break
        }
      }

      dispatch(moveItem({ queueId: qId, prevQueueId: lastPlayed }))
    } else {
      // Standard/guest users may only move their own songs, and only to the
      // front of their own upcoming turn — not ahead of other users' turns.
      //
      // Strategy: in the REAL queue order (not round-robin), find the user's
      // first upcoming song that isn't the one being moved.  Insert just before
      // it so this song becomes the user's next song to sing while everyone
      // else's turn order is undisturbed.
      const firstOwnIdx = realQueue.result.findIndex(
        id => id !== qId
          && id !== queueId
          && !playerHistory.includes(id)
          && realQueue.entities[id]?.userId === userId,
      )

      // prevQueueId = the item just before the user's first upcoming song.
      // If no other own songs exist, fall back to after the currently playing
      // song (round-robin will schedule it normally from there).
      const prevQueueId = firstOwnIdx > 0
        ? realQueue.result[firstOwnIdx - 1]
        : queueId

      dispatch(moveItem({ queueId: qId, prevQueueId }))
    }
  }

  const handleRemoveUpcoming = (userId: number) => {
    dispatch(removeUpcomingItems(userId))
  }

  // build children array
  const items = queue.result.map((qId) => {
    const item = queue.entities[qId]
    const duration = songs.entities[item.songId].duration
    const isCurrent = (qId === queueId) && !isAtQueueEnd
    const isUpcoming = qId !== queueId && !playerHistory.includes(qId)
    const isOwner = item.userId === user.userId

    return (
      <QueueItem
        {...item}
        artist={artists.entities[songs.entities[item.songId].artistId].name}
        errorMessage={isCurrent && errorMessage ? errorMessage : ''}
        isCurrent={isCurrent}
        key={qId}
        isErrored={isCurrent && isErrored}
        isInfoable={user.isAdmin}
        isMovable={isUpcoming && (isOwner || user.isAdmin || user.role === 'room_manager')}
        isOwner={isOwner}
        isPlayed={!isUpcoming && !isCurrent}
        isPlaying={isCurrent && isPlaying}
        isRemovable={isUpcoming && (isOwner || user.isAdmin)}
        isReplayable={(!isUpcoming || isCurrent) && user.isAdmin}
        isSkippable={isCurrent && (isOwner || user.isAdmin)}
        isStarred={starredSongs.includes(item.songId)}
        isUpcoming={isUpcoming}
        pctPlayed={isCurrent ? position / duration * 100 : 0}
        starCount={starCounts.songs[item.songId] || 0}
        title={songs.entities[item.songId].title}
        wait={formatSeconds(waits[qId], true)} // fuzzy
        // actions
        onMoveClick={handleMoveClick}
        onRemoveUpcoming={handleRemoveUpcoming}
      />
    )
  })

  return <QueueListAnimator queueItems={items} />
}

export default QueueList
