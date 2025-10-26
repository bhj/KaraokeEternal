import React, { useCallback, useState } from 'react'
import clsx from 'clsx'
import Highlighter from 'react-highlight-words'
import { useSwipeable } from 'react-swipeable'
import Button from 'components/Button/Button'
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
  onSongQueue(songId: number): void
  onSongStarClick(songId: number): void
  onSongInfo(songId: number): void
  isQueued: boolean
  isStarred: boolean
  isAdmin: boolean
  numStars: number
  numMedia: number
  filterKeywords: string[]
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
      className={clsx(styles.container, isQueued && styles.queued, isStarred && styles.starred, isExpanded && styles.expanded)}
    >
      <ToggleAnimation toggle={isQueued} className={styles.animateGlow}>
        <div className={styles.duration}>
          {formatDuration(duration)}
        </div>
        <div onClick={handleClick} className={styles.primary}>
          <div className={styles.title}>
            {filterKeywords?.length ? <Highlighter autoEscape textToHighlight={title} searchWords={filterKeywords} /> : title}
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

      <Buttons btnWidth={52} isExpanded={isExpanded}>
        <Button onClick={handleStarClick} className={clsx(styles.btn, styles.star)}>
          <ToggleAnimation toggle={isStarred} className={styles.animateStar}>
            <Icon size={44} icon='STAR_FULL' />
          </ToggleAnimation>
          <div className={styles.starCount}>
            {numStars || ''}
          </div>
        </Button>
        <Button onClick={handleInfoClick} className={clsx(styles.btn, styles.info)} data-hide>
          <Icon size={44} icon='INFO_OUTLINE' />
        </Button>
      </Buttons>
    </div>
  )
}

export default SongItem
