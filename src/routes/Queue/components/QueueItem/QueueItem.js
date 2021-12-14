import PropTypes from 'prop-types'
import React, { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'

import Button from 'components/Button'
import Buttons from 'components/Buttons'
import Icon from 'components/Icon'
import Swipeable from 'components/Swipeable'
import ToggleAnimation from 'components/ToggleAnimation'
import UserImage from 'components/UserImage'
import styles from './QueueItem.css'

import { requestPlayNext } from 'store/modules/status'
import { showSongInfo } from 'store/modules/songInfo'
import { queueSong, removeItem } from '../../modules/queue'
import { toggleSongStarred } from 'store/modules/userStars'
import { showErrorMessage } from 'store/modules/ui'

const QueueItem = props => {
  const [isExpanded, setExpanded] = useState(false)

  const handleSwipedLeft = useCallback(() => {
    setExpanded(props.isErrored || props.isInfoable || props.isRemovable || props.isSkippable)
  }, [props.isErrored, props.isInfoable, props.isRemovable, props.isSkippable])

  const handleSwipedRight = useCallback(() => setExpanded(false), [])

  const dispatch = useDispatch()
  const handleErrorInfoClick = useCallback(() => dispatch(showErrorMessage(props.errorMessage)), [dispatch, props.errorMessage])
  const handleSkipClick = useCallback(() => dispatch(requestPlayNext()), [dispatch])
  const handleStarClick = useCallback(() => dispatch(toggleSongStarred(props.songId)), [dispatch, props.songId])
  const handleInfoClick = useCallback(() => dispatch(showSongInfo(props.songId)), [dispatch, props.songId])
  const handleRemoveClick = useCallback(() => dispatch(removeItem(props.queueId)), [dispatch, props.queueId])

  return (
    <Swipeable
      onSwipedLeft={handleSwipedLeft}
      onSwipedRight={handleSwipedRight}
      preventDefaultTouchmoveEvent
      trackMouse
      style={{ backgroundSize: (props.isCurrent && props.pctPlayed < 2 ? 2 : props.pctPlayed) + '% 100%' }}
      className={styles.container}
    >
      <div className={styles.content}>
        <div className={`${styles.imageContainer} ${props.isPlayed ? styles.greyed : ''}`}>
          <UserImage userId={props.userId} dateUpdated={props.dateUpdated} height={72} className={styles.image}/>
          <div className={styles.waitContainer}>
            {props.isUpcoming &&
              <div className={`${styles.wait} ${props.isOwner ? styles.isOwner : ''}`}>
                {props.wait}
              </div>
            }
          </div>
        </div>

        <div className={`${styles.primary} ${props.isPlayed ? styles.greyed : ''}`}>
          <div className={styles.innerPrimary}>
            <div className={styles.title}>{props.title}</div>
            <div className={styles.artist}>{props.artist}</div>
          </div>
          <div className={`${styles.user} ${props.isOwner ? styles.isOwner : ''}`}>
            {props.userDisplayName}
          </div>
        </div>

        <Buttons btnWidth={50} isExpanded={isExpanded}>
          {props.isErrored &&
            <Button
              className={`${styles.btn} ${styles.danger}`}
              icon='INFO_OUTLINE'
              onClick={handleErrorInfoClick}
              size={44}
            />
          }
          <Button
            animateClassName={styles.animateStar}
            className={`${styles.btn} ${props.isStarred ? styles.active : ''}`}
            icon={'STAR_FULL'}
            onClick={handleStarClick}
            size={44}
          />
          {props.isInfoable &&
            <Button
              className={`${styles.btn} ${styles.active}`}
              data-hide
              icon='INFO_OUTLINE'
              onClick={handleInfoClick}
              size={44}
            />
          }
          {props.isRemovable &&
            <Button
              className={`${styles.btn} ${styles.danger}`}
              data-hide
              icon='CLEAR'
              onClick={handleRemoveClick}
              size={44}
            />
          }
          {props.isSkippable &&
            <Button
              className={`${styles.btn} ${styles.danger}`}
              data-hide
              icon='PLAY_NEXT'
              onClick={handleSkipClick}
              size={44}
            />
          }
        </Buttons>
      </div>
    </Swipeable>
  )
}

QueueItem.propTypes = {
  artist: PropTypes.string.isRequired,
  dateUpdated: PropTypes.number.isRequired,
  errorMessage: PropTypes.string.isRequired,
  isCurrent: PropTypes.bool.isRequired,
  isErrored: PropTypes.bool.isRequired,
  isInfoable: PropTypes.bool.isRequired,
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
}

export default React.memo(QueueItem)
