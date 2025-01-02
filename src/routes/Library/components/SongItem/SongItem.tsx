import React, { useCallback, useState } from 'react'
import Highlighter from 'react-highlight-words'
import { useSwipeable } from 'react-swipeable'
import Buttons from 'components/Buttons/Buttons'
import Icon from 'components/Icon/Icon'
import ToggleAnimation from 'components/ToggleAnimation/ToggleAnimation'
import { formatDuration } from 'lib/dateTime'
import styles from './SongItem.css'

let ignoreMouseup = false

interface SongItemProps {
  songId: number
  artist?: string
  title: string
  duration: number
  onSongQueue(...args: unknown[]): unknown
  onSongStarClick(...args: unknown[]): unknown
  onSongInfo(...args: unknown[]): unknown
  isQueued: boolean
  isStarred: boolean
  isAdmin: boolean
  numStars: number
  numMedia: number
  filterKeywords: unknown[]
}

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
}: SongItemProps) => {
  const [isExpanded, setExpanded] = useState(false)

  const handleClick = useCallback(() => {
    if (ignoreMouseup) ignoreMouseup = false
    else onSongQueue(songId)
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
            {isAdmin && numMedia > 1 && (
              <i>
                {' '}
                (
                {numMedia}
                )
              </i>
            )}
            {artist && <div className={styles.artist}>{artist}</div>}
          </div>
        </div>
      </ToggleAnimation>

      <Buttons btnWidth={50} isExpanded={isExpanded}>
        <div onClick={handleStarClick} className={`${styles.btn} ${styles.star}`}>
          <ToggleAnimation toggle={isStarred} className={styles.animateStar}>
            <Icon size={44} icon='STAR_FULL' className={isStarred ? styles.starStarred : styles.star} />
          </ToggleAnimation>
          <div className={isStarred ? styles.starCountStarred : styles.starCount}>
            {numStars || ''}
          </div>
        </div>
        <div onClick={handleInfoClick} className={styles.btn} data-hide>
          <Icon size={44} icon='INFO_OUTLINE' className={`${styles.btn} ${styles.info}`} />
        </div>
      </Buttons>
    </div>
  )
}

export default SongItem
