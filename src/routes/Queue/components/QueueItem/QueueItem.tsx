import React, { useCallback, useRef, useState } from 'react'
import clsx from 'clsx'
import { useSwipeable } from 'react-swipeable'
import { useLongPress } from 'use-long-press'
import { useAppDispatch } from 'store/hooks'
import Button from 'components/Button/Button'
import Buttons from 'components/Buttons/Buttons'
import UserImage from 'components/UserImage/UserImage'
import { requestPlayNext, requestReplay } from 'store/modules/status'
import { showSongInfo } from 'store/modules/songInfo'
import { toggleSongStarred } from 'store/modules/userStars'
import { showErrorMessage } from 'store/modules/ui'
import { queueSong, removeItem, updateCoSingers } from '../../modules/queue'
import styles from './QueueItem.css'

const LONG_PRESS_THRESHOLD_MS = 700

interface QueueItemProps {
  artist: string
  errorMessage: string
  isCurrent: boolean
  isErrored: boolean
  isInfoable: boolean
  isMovable: boolean
  isOwner: boolean
  isPlayed: boolean
  isPlaying: boolean
  isRemovable: boolean
  isReplayable: boolean
  isSkippable: boolean
  isStarred: boolean
  isUpcoming: boolean
  pctPlayed: number
  queueId: number
  songId: number
  title: string
  userDateUpdated: number
  userDisplayName: string
  userId: number
  wait?: string
  coSingers?: string[]
  // actions
  onMoveClick(queueId: number): void
  onRemoveUpcoming: (userId: number) => void
}

const QueueItem = ({
  artist,
  coSingers,
  errorMessage,
  isCurrent,
  isErrored,
  isInfoable,
  isMovable,
  isOwner,
  isPlayed,
  isPlaying,
  isRemovable,
  isReplayable,
  isSkippable,
  isStarred,
  isUpcoming,
  onMoveClick,
  onRemoveUpcoming,
  pctPlayed,
  queueId,
  songId,
  title,
  userDateUpdated,
  userDisplayName,
  userId,
  wait,
}: QueueItemProps) => {
  const [isExpanded, setExpanded] = useState(false)
  const longPressActiveRef = useRef(false)

  const dispatch = useAppDispatch()
  const handleErrorInfoClick = useCallback(() => dispatch(showErrorMessage(errorMessage)), [dispatch, errorMessage])
  const handleInfoClick = useCallback(() => dispatch(showSongInfo(songId)), [dispatch, songId])
  const handleMoveClick = useCallback(() => {
    onMoveClick(queueId)
    setExpanded(false)
  }, [onMoveClick, queueId])
  const handleReplayClick = useCallback(() => {
    dispatch(requestReplay(queueId))
    setExpanded(false)
  }, [dispatch, queueId])
  const handleRequeueClick = useCallback(() => {
    dispatch(queueSong(songId))
    setExpanded(false)
  }, [dispatch, songId])
  const handleRemoveClick = useCallback(() => dispatch(removeItem({ queueId })), [dispatch, queueId])
  const handleSkipClick = useCallback(() => dispatch(requestPlayNext()), [dispatch])
  const handleStarClick = useCallback(() => dispatch(toggleSongStarred(songId)), [dispatch, songId])

  const handleEditCoSingersClick = useCallback(() => {
    const currentCoSingers = coSingers?.join(', ') || ''
    const input = prompt('Co-singers (comma-separated):', currentCoSingers)
    if (input !== null) {
      const newCoSingers = input
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
      dispatch(updateCoSingers({ queueId, coSingers: newCoSingers }))
      setExpanded(false)
    }
  }, [coSingers, dispatch, queueId])

  const canEditCoSingers = isUpcoming && isOwner

  const swipeHandlers = useSwipeable({
    onSwipedLeft: useCallback(() => {
      setExpanded(isErrored || isInfoable || isRemovable || isSkippable || canEditCoSingers)
    }, [isErrored, isInfoable, isRemovable, isSkippable, canEditCoSingers]),
    onSwipedRight: useCallback(() => setExpanded(false), []),
    preventScrollOnSwipe: true,
    trackMouse: true,
  })

  const bindRemovePressHandlers = useLongPress(() => {
    const confirmText = isOwner ? 'Remove all your upcoming songs?' : `Remove all upcoming songs for "${userDisplayName}"?`
    longPressActiveRef.current = true

    if (confirm(confirmText)) {
      onRemoveUpcoming(userId)
    }
  }, { threshold: LONG_PRESS_THRESHOLD_MS, cancelOnMovement: true })

  const bindSkipPressHandlers = useLongPress(() => {
    const confirmText = isOwner ? 'Skip and remove all your upcoming songs?' : `Skip and remove all upcoming songs for "${userDisplayName}"?`
    longPressActiveRef.current = true

    if (confirm(confirmText)) {
      onRemoveUpcoming(userId)
      handleSkipClick()
    }
  }, { threshold: LONG_PRESS_THRESHOLD_MS, cancelOnMovement: true })

  return (
    <div
      {...swipeHandlers}
      className={clsx(
        styles.container,
        isCurrent && styles.current,
        isCurrent && !isPlaying && styles.paused,
      )}
      style={{ '--progress': (isCurrent && pctPlayed < 2 ? 2 : pctPlayed) + '%' } as React.CSSProperties}
    >
      <div className={styles.content}>
        <div className={clsx(styles.imageContainer, isPlayed && styles.greyed)}>
          <UserImage userId={userId} dateUpdated={userDateUpdated} />
          <div className={styles.waitContainer}>
            {isUpcoming && (
              <div className={clsx(styles.wait, isOwner && styles.isOwner)}>
                {wait}
              </div>
            )}
          </div>
        </div>

        <div className={clsx(styles.primary, isPlayed && styles.greyed)} translate='no'>
          <div className={styles.innerPrimary}>
            <div className={styles.title}>{title}</div>
            <div className={styles.artist}>{artist}</div>
          </div>
          <div className={clsx(styles.user, isOwner && styles.isOwner)}>
            {userDisplayName}
          </div>
        </div>

        <Buttons btnWidth={56} isExpanded={isExpanded} className={styles.btnContainer}>
          {isErrored && (
            <Button
              className={styles.danger}
              icon='INFO_OUTLINE'
              onClick={handleErrorInfoClick}
            />
          )}
          <Button
            animateClassName={styles.animateStar}
            className={clsx(isStarred && styles.active)}
            icon='STAR_FULL'
            onClick={handleStarClick}
          />
          {canEditCoSingers && (
            <Button
              className={styles.active}
              data-hide
              icon='ACCOUNT'
              onClick={handleEditCoSingersClick}
            />
          )}
          {isInfoable && (
            <Button
              className={styles.active}
              data-hide
              icon='INFO_OUTLINE'
              onClick={handleInfoClick}
            />
          )}
          {isMovable && (
            <Button
              className={clsx(styles.btnMove, styles.active)}
              data-hide
              icon='MOVE_TOP'
              onClick={handleMoveClick}
            />
          )}
          {isPlayed && (
            <Button
              className={clsx(styles.btnAdd, styles.active)}
              data-hide
              icon='PLUS'
              onClick={handleRequeueClick}
            />
          )}
          {isReplayable && (
            <Button
              className={clsx(styles.active, styles.danger)}
              data-hide
              icon='REPLAY'
              onClick={handleReplayClick}
            />
          )}
          {isRemovable && (
            <Button
              className={clsx(styles.btnRemove, styles.danger)}
              data-hide
              icon='DELETE'
              onTouchEnd={(e: React.TouchEvent<HTMLButtonElement>) => {
                if (longPressActiveRef.current) {
                  e.preventDefault()
                  e.stopPropagation()
                  longPressActiveRef.current = false
                  return
                }
              }}
              onClick={() => {
                if (longPressActiveRef.current) {
                  longPressActiveRef.current = false
                  return
                }
                handleRemoveClick()
              }}
              {...bindRemovePressHandlers()}
            />
          )}
          {isSkippable && (
            <Button
              className={clsx(styles.btnPlayNext, styles.danger)}
              data-hide
              icon='PLAY_NEXT'
              onTouchEnd={(e: React.TouchEvent<HTMLButtonElement>) => {
                if (longPressActiveRef.current) {
                  e.preventDefault()
                  e.stopPropagation()
                  longPressActiveRef.current = false
                  return
                }
              }}
              onClick={() => {
                if (longPressActiveRef.current) {
                  longPressActiveRef.current = false
                  return
                }
                handleSkipClick()
              }}
              {...bindSkipPressHandlers()}
            />
          )}
        </Buttons>
      </div>
    </div>
  )
}

export default React.memo(QueueItem)
