import React, { useCallback, useState } from 'react'
import clsx from 'clsx'
import { useAppDispatch } from 'store/hooks'
import { useSwipeable } from 'react-swipeable'
import Button from 'components/Button/Button'
import Buttons from 'components/Buttons/Buttons'
import UserImage from 'components/UserImage/UserImage'
import { requestPlayNext } from 'store/modules/status'
import { showSongInfo } from 'store/modules/songInfo'
import { toggleSongStarred } from 'store/modules/userStars'
import { showErrorMessage } from 'store/modules/ui'
import { queueSong, removeItem } from '../../modules/queue'
import styles from './QueueItem.css'

interface QueueItemProps {
  artist: string
  errorMessage: string
  isCurrent: boolean
  isErrored: boolean
  isInfoable: boolean
  isMovable: boolean
  isOwner: boolean
  isPlayed: boolean
  isRemovable: boolean
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
  // actions
  onMoveClick(queueId: number): void
}

const QueueItem = ({
  artist,
  errorMessage,
  isCurrent,
  isErrored,
  isInfoable,
  isMovable,
  isOwner,
  isPlayed,
  isRemovable,
  isSkippable,
  isStarred,
  isUpcoming,
  onMoveClick,
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

  const dispatch = useAppDispatch()
  const handleErrorInfoClick = useCallback(() => dispatch(showErrorMessage(errorMessage)), [dispatch, errorMessage])
  const handleInfoClick = useCallback(() => dispatch(showSongInfo(songId)), [dispatch, songId])
  const handleMoveClick = useCallback(() => {
    onMoveClick(queueId)
    setExpanded(false)
  }, [onMoveClick, queueId])
  const handleRequeueClick = useCallback(() => {
    dispatch(queueSong(songId))
    setExpanded(false)
  }, [dispatch, songId])
  const handleRemoveClick = useCallback(() => dispatch(removeItem({ queueId })), [dispatch, queueId])
  const handleSkipClick = useCallback(() => dispatch(requestPlayNext()), [dispatch])
  const handleStarClick = useCallback(() => dispatch(toggleSongStarred(songId)), [dispatch, songId])

  const swipeHandlers = useSwipeable({
    onSwipedLeft: useCallback(() => {
      setExpanded(isErrored || isInfoable || isRemovable || isSkippable)
    }, [isErrored, isInfoable, isRemovable, isSkippable]),
    onSwipedRight: useCallback(() => setExpanded(false), []),
    preventScrollOnSwipe: true,
    trackMouse: true,
  })

  return (
    <div
      {...swipeHandlers}
      className={styles.container}
      style={{ backgroundSize: (isCurrent && pctPlayed < 2 ? 2 : pctPlayed) + '% 100%' }}
    >
      <div className={styles.content}>
        <div className={clsx(styles.imageContainer, isPlayed && styles.greyed)}>
          <UserImage userId={userId} dateUpdated={userDateUpdated} height={72} className={styles.image} />
          <div className={styles.waitContainer}>
            {isUpcoming && (
              <div className={clsx(styles.wait, isOwner && styles.isOwner)}>
                {wait}
              </div>
            )}
          </div>
        </div>

        <div className={clsx(styles.primary, isPlayed && styles.greyed)}>
          <div className={styles.innerPrimary}>
            <div className={styles.title}>{title}</div>
            <div className={styles.artist}>{artist}</div>
          </div>
          <div className={clsx(styles.user, isOwner && styles.isOwner)}>
            {userDisplayName}
          </div>
        </div>

        <Buttons btnWidth={50} isExpanded={isExpanded}>
          {isErrored && (
            <Button
              className={clsx(styles.btn, styles.danger)}
              icon='INFO_OUTLINE'
              onClick={handleErrorInfoClick}
              size={44}
            />
          )}
          <Button
            animateClassName={styles.animateStar}
            className={clsx(styles.btn, isStarred && styles.active)}
            icon='STAR_FULL'
            onClick={handleStarClick}
            size={44}
          />
          {isPlayed && (
            <Button
              className={clsx(styles.btn, styles.active)}
              data-hide
              icon='REFRESH'
              onClick={handleRequeueClick}
              size={48}
            />
          )}
          {isMovable && (
            <Button
              className={clsx(styles.btn, styles.active)}
              data-hide
              icon='MOVE_TOP'
              onClick={handleMoveClick}
              size={44}
            />
          )}
          {isInfoable && (
            <Button
              className={clsx(styles.btn, styles.active)}
              data-hide
              icon='INFO_OUTLINE'
              onClick={handleInfoClick}
              size={44}
            />
          )}
          {isRemovable && (
            <Button
              className={clsx(styles.btn, styles.danger)}
              data-hide
              icon='CLEAR'
              onClick={handleRemoveClick}
              size={44}
            />
          )}
          {isSkippable && (
            <Button
              className={clsx(styles.btn, styles.danger)}
              data-hide
              icon='PLAY_NEXT'
              onClick={handleSkipClick}
              size={44}
            />
          )}
        </Buttons>
      </div>
    </div>
  )
}

export default React.memo(QueueItem)
