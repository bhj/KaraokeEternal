import PropTypes from 'prop-types'
import React, { useCallback, useState } from 'react'
import Highlighter from 'react-highlight-words'
import { useSwipeable } from 'react-swipeable'

import Buttons from 'components/Buttons'
import Icon from 'components/Icon'
import ToggleAnimation from 'components/ToggleAnimation'
import { formatDuration } from 'lib/dateTime'
import styles from './SongItem.css'

let ignoreMouseup = false

const SongItem = ({
  songId,
  artist,
  title,
  duration,
  onSongQueue,
  onSongStarClick,
  onSongInfo,
  isQueued,
  isStarred,
  isAdmin,
  numStars,
  numMedia,
  filterKeywords,
}) => {
  const [isExpanded, setExpanded] = useState(false)

  const handleClick = useCallback(() => {
    ignoreMouseup ? ignoreMouseup = false : onSongQueue(songId)
  }, [onSongQueue, songId])
  const handleInfoClick = useCallback(() => onSongInfo(songId), [onSongInfo, songId])
  const handleStarClick = useCallback(() => onSongStarClick(songId), [onSongStarClick, songId])

  const swipeHandlers = useSwipeable({
    onSwipedLeft: useCallback(({ event }) => {
      ignoreMouseup = event.type === 'mouseup'
      setExpanded(isAdmin)
    }, [isAdmin]),
    onSwipedRight: useCallback(({ event }) => {
      ignoreMouseup = event.type === 'mouseup'
      setExpanded(false)
    }, []),
    preventScrollOnSwipe: true,
    trackMouse: true,
  })

  return (
    <div
      {...swipeHandlers}
      style={{ height: artist ? 60 : 44 }}
      className={isQueued ? styles.containerQueued : styles.container}
    >
      <ToggleAnimation toggle={isQueued} className={styles.animateGlow}>
        <div className={styles.duration}>
          {formatDuration(duration)}
        </div>
        <div onClick={handleClick} className={styles.primary}>
          <div className={styles.title}>
            <Highlighter autoEscape textToHighlight={title} searchWords={filterKeywords} />
            {isAdmin && numMedia > 1 && <i> ({numMedia})</i>}
            {artist && <div className={styles.artist}>{artist}</div>}
          </div>
        </div>
      </ToggleAnimation>

      <Buttons btnWidth={50} isExpanded={isExpanded}>
        <div onClick={handleStarClick} className={`${styles.btn} ${styles.star}`}>
          <ToggleAnimation toggle={isStarred} className={styles.animateStar}>
            <Icon size={44} icon={'STAR_FULL'} className={isStarred ? styles.starStarred : styles.star}/>
          </ToggleAnimation>
          <div className={isStarred ? styles.starCountStarred : styles.starCount}>
            {numStars || ''}
          </div>
        </div>
        <div onClick={handleInfoClick} className={styles.btn} data-hide>
          <Icon size={44} icon='INFO_OUTLINE' className={`${styles.btn} ${styles.info}`}/>
        </div>
      </Buttons>
    </div>
  )
}

SongItem.propTypes = {
  songId: PropTypes.number.isRequired,
  artist: PropTypes.string,
  title: PropTypes.string.isRequired,
  duration: PropTypes.number.isRequired,
  onSongQueue: PropTypes.func.isRequired,
  onSongStarClick: PropTypes.func.isRequired,
  onSongInfo: PropTypes.func.isRequired,
  isQueued: PropTypes.bool.isRequired,
  isStarred: PropTypes.bool.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  numStars: PropTypes.number.isRequired,
  numMedia: PropTypes.number.isRequired,
  filterKeywords: PropTypes.array.isRequired,
}

export default SongItem
