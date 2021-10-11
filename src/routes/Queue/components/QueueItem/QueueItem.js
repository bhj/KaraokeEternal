import PropTypes from 'prop-types'
import React, { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'

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
  const [isExpanded, setExpanded] = useState(true)

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
            <div onClick={handleErrorInfoClick} className={`${styles.btn} ${styles.danger}`}>
              <Icon icon='INFO_OUTLINE' size={44} />
            </div>
          }
          <div onClick={handleStarClick} className={`${styles.btn} ${props.isStarred ? styles.active : ''}`}>
            <ToggleAnimation toggle={props.isStarred} className={styles.animateStar}>
              <Icon size={44} icon={'STAR_FULL'}/>
            </ToggleAnimation>
          </div>
          {props.isInfoable &&
            <div onClick={handleInfoClick} className={`${styles.btn} ${styles.active}`} data-hide>
              <Icon icon='INFO_OUTLINE' size={44} />
            </div>
          }
          {props.isRemovable &&
            <div onClick={handleRemoveClick} className={`${styles.btn} ${styles.danger}`} data-hide>
              <Icon icon='CLEAR' size={44} />
            </div>
          }
          {props.isSkippable &&
            <div onClick={handleSkipClick} className={`${styles.btn} ${styles.danger}`} data-hide>
              <Icon icon='PLAY_NEXT' size={44} />
            </div>
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
