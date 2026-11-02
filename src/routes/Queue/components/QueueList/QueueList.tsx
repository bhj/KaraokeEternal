import React from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { ensureState } from 'redux-optimistic-ui'
import QueueItem from '../QueueItem/QueueItem'
import ProviderQueueItem from '../ProviderQueueItem/ProviderQueueItem'
import QueueListAnimator from '../QueueListAnimator/QueueListAnimator'
import { formatSeconds } from 'lib/dateTime'
import { moveItem, removeUpcomingItems } from '../../modules/queue'
import { providerFetchCancel, providerFetchRequest } from '../../../Library/modules/library'
import getPlayerHistory from '../../selectors/getPlayerHistory'
import getRoundRobinQueue from '../../selectors/getRoundRobinQueue'
import getDisplayQueue from '../../selectors/getDisplayQueue'
import getWaits from '../../selectors/getWaits'
import type { PendingQueueItem } from '../../selectors/getPendingQueue'

const QueueList = () => {
  const artists = useAppSelector(state => state.artists)
  const { errorMessage, isAtQueueEnd, isErrored, isPlaying, position, queueId } = useAppSelector(state => state.status)

  const playerHistory = useAppSelector(getPlayerHistory)
  const queue = useAppSelector(getRoundRobinQueue)
  const rows = useAppSelector(getDisplayQueue)
  const songs = useAppSelector(state => state.songs)
  const starredSongs = useAppSelector(state => ensureState(state.userStars).starredSongs)
  const starCounts = useAppSelector(state => state.starCounts)
  const user = useAppSelector(state => state.user)
  const waits = useAppSelector(getWaits)

  // actions
  const dispatch = useAppDispatch()
  const handleMoveClick = (qId: number) => {
    // reference user's last-played item as the new prevQueueId
    const userId = queue.entities[qId].userId
    let lastPlayed = queueId // default in case user has no played items

    for (let i = queue.result.indexOf(queueId); i >= 0; i--) {
      if (queue.entities[queue.result[i]].userId === userId) {
        lastPlayed = queue.result[i]
        break
      }
    }

    dispatch(moveItem({ queueId: qId, prevQueueId: lastPlayed }))
  }

  const handleRemoveUpcoming = (userId: number) => {
    dispatch(removeUpcomingItems(userId))
  }

  const handleProviderCancel = (providerId: number, itemId: string, userId: number) => {
    dispatch(providerFetchCancel({ providerId, itemId, userId }))
  }

  // retries as the row's singer (only an admin may name someone else)
  const handleProviderRetry = (p: PendingQueueItem) => {
    dispatch(providerFetchRequest({
      providerId: p.providerId,
      itemId: p.itemId,
      title: p.title,
      artist: p.artist,
      source: p.source,
      iconUrl: p.iconUrl,
      duration: p.duration,
      userId: p.userId,
      userDisplayName: p.userDisplayName,
      userDateUpdated: p.userDateUpdated,
    }))
  }

  const formatWait = (key: string) => waits[key] === undefined ? undefined : formatSeconds(waits[key], true) // fuzzy

  // build children array
  const items: React.ReactElement[] = []
  for (const row of rows) {
    if (row.kind === 'pending') {
      const p = row.item
      const isOwner = p.userId === user.userId

      items.push(
        <ProviderQueueItem
          key={row.key}
          providerId={p.providerId}
          itemId={p.itemId}
          title={p.title}
          artist={p.artist}
          source={p.source}
          iconUrl={p.iconUrl}
          status={p.status}
          progress={p.progress}
          error={p.error}
          userId={p.userId}
          userDisplayName={p.userDisplayName}
          userDateUpdated={p.userDateUpdated}
          wait={p.duration === undefined ? undefined : formatWait(row.key)}
          isAdmin={user.isAdmin}
          isOwner={isOwner}
          isCancelable={isOwner || user.isAdmin}
          isRetryable={(isOwner || user.isAdmin) && p.status === 'error'}
          onCancel={handleProviderCancel}
          onRetry={() => handleProviderRetry(p)}
        />,
      )
      continue
    }

    const qId = row.queueId
    const item = queue.entities[qId]
    const song = songs.entities[item.songId]
    // Library state may briefly lag the queue (e.g. a provider ingest just
    // pushed QUEUE_PUSH with a new songId; LIBRARY_PUSH lands a tick later).
    // Skip rendering until the song is available rather than crashing.
    if (!song) continue
    const duration = song.duration
    const isCurrent = (qId === queueId) && !isAtQueueEnd
    const isUpcoming = qId !== queueId && !playerHistory.includes(qId)
    const isOwner = item.userId === user.userId

    items.push(
      <QueueItem
        {...item}
        artist={artists.entities[song.artistId].name}
        errorMessage={isCurrent && errorMessage ? errorMessage : ''}
        isCurrent={isCurrent}
        key={row.key}
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
        starCount={starCounts.songs[item.songId] || 0}
        title={song.title}
        wait={formatWait(row.key)}
        // actions
        onMoveClick={handleMoveClick}
        onRemoveUpcoming={handleRemoveUpcoming}
      />,
    )
  }

  return <QueueListAnimator queueItems={items} />
}

export default QueueList
