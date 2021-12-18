import PropTypes from 'prop-types'
import React, { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useSwipeable } from 'react-swipeable'

import Buttons from 'components/Buttons'
import Icon from 'components/Icon'
import ToggleAnimation from 'components/ToggleAnimation'
import UserImage from 'components/UserImage'
import styles from './QueueItem.css'

import { requestPlayNext } from 'store/modules/status'
import { showSongInfo } from 'store/modules/songInfo'
import { queueSong, removeItem } from '../../modules/queue'
import { toggleSongStarred } from 'store/modules/userStars'
import { showErrorMessage } from 'store/modules/ui'

const QueueItem = ({
  artist,
  dateUpdated,
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
  userId,
  userDisplayName,
  wait,
  ...props
}) => {
  const [isExpanded, setExpanded] = useState(false)

  const dispatch = useDispatch()
  const handleErrorInfoClick = useCallback(() => dispatch(showErrorMessage(errorMessage)), [dispatch, errorMessage])
  const handleSkipClick = useCallback(() => dispatch(requestPlayNext()), [dispatch])
  const handleStarClick = useCallback(() => dispatch(toggleSongStarred(songId)), [dispatch, songId])
  const handleInfoClick = useCallback(() => dispatch(showSongInfo(songId)), [dispatch, songId])
  const handleRemoveClick = useCallback(() => dispatch(removeItem(queueId)), [dispatch, queueId])
  const handleMoveClick = useCallback(() => {
    onMoveClick(queueId)
    setExpanded(false)
  }, [onMoveClick, queueId])

  const swipeHandlers = useSwipeable({
    onSwipedLeft: useCallback(() => {
      setExpanded(isErrored || isInfoable || isRemovable || isSkippable)
    }, [isErrored, isInfoable, isRemovable, isSkippable]),
    onSwipedRight: useCallback(() => setExpanded(false), []),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  })

  return (
    <div
      {...swipeHandlers}
      className={styles.container}
      style={{ backgroundSize: (isCurrent && pctPlayed < 2 ? 2 : pctPlayed) + '% 100%' }}
    >
      <div className={styles.content}>
        <div className={`${styles.imageContainer} ${isPlayed ? styles.greyed : ''}`}>
          <UserImage userId={userId} dateUpdated={dateUpdated} height={72} className={styles.image}/>
          <div className={styles.waitContainer}>
            {isUpcoming &&
              <div className={`${styles.wait} ${isOwner ? styles.isOwner : ''}`}>
                {wait}
              </div>
            }
          </div>
        </div>

        <div className={`${styles.primary} ${isPlayed ? styles.greyed : ''}`}>
          <div className={styles.innerPrimary}>
            <div className={styles.title}>{title}</div>
            <div className={styles.artist}>{artist}</div>
          </div>
          <div className={`${styles.user} ${isOwner ? styles.isOwner : ''}`}>
            {userDisplayName}
          </div>
        </div>

        <Buttons btnWidth={50} isExpanded={isExpanded}>
          {isErrored &&
            <div onClick={handleErrorInfoClick} className={`${styles.btn} ${styles.danger}`}>
              <Icon icon='INFO_OUTLINE' size={44} />
            </div>
          }
          <div onClick={handleStarClick} className={`${styles.btn} ${isStarred ? styles.active : ''}`}>
            <ToggleAnimation toggle={isStarred} className={styles.animateStar}>
              <Icon size={44} icon={'STAR_FULL'}/>
            </ToggleAnimation>
          </div>
          {isMovable &&
            <div onClick={handleMoveClick} className={`${styles.btn} ${styles.active}`} data-hide>
              <Icon icon='MOVE_TOP' size={44} />
            </div>
          }
          {isInfoable &&
            <div onClick={handleInfoClick} className={`${styles.btn} ${styles.active}`} data-hide>
              <Icon icon='INFO_OUTLINE' size={44} />
            </div>
          }
          {isRemovable &&
            <div onClick={handleRemoveClick} className={`${styles.btn} ${styles.danger}`} data-hide>
              <Icon icon='CLEAR' size={44} />
            </div>
          }
          {isSkippable &&
            <div onClick={handleSkipClick} className={`${styles.btn} ${styles.danger}`} data-hide>
              <Icon icon='PLAY_NEXT' size={44} />
            </div>
          }
        </Buttons>
      </div>
    </div>
  )
}

QueueItem.propTypes = {
  artist: PropTypes.string.isRequired,
  dateUpdated: PropTypes.number.isRequired,
  errorMessage: PropTypes.string.isRequired,
  isCurrent: PropTypes.bool.isRequired,
  isErrored: PropTypes.bool.isRequired,
  isInfoable: PropTypes.bool.isRequired,
  isMovable: PropTypes.bool.isRequired,
  isOwner: PropTypes.bool.isRequired,
  isPlayed: PropTypes.bool.isRequired,
  isRemovable: PropTypes.bool.isRequired,
  isSkippable: PropTypes.bool.isRequired,
  isStarred: PropTypes.bool.isRequired,
  isUpcoming: PropTypes.bool.isRequired,
  pctPlayed: PropTypes.number.isRequired,
  queueId: PropTypes.number.isRequired,
  songId: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  userId: PropTypes.number.isRequired,
  userDisplayName: PropTypes.string.isRequired,
  wait: PropTypes.string,
  // actions
  onMoveClick: PropTypes.func.isRequired,
}

export default React.memo(QueueItem)
