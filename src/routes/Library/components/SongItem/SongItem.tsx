import React, { useState } from 'react'
import clsx from 'clsx'
import Highlighter from 'react-highlight-words'
import { useSwipeable } from 'react-swipeable'
import Button from 'components/Button/Button'
import ButtonStar from 'components/ButtonStar/ButtonStar'
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
  isPlayed: boolean
  isStarred: boolean
  isUpcoming: boolean
  isAdmin: boolean
  /** True when the current user is a room manager (swipe reveals info button) */
  isRoomManager: boolean
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
  isPlayed,
  isStarred,
  isUpcoming,
  isAdmin,
  isRoomManager,
  numStars,
  numMedia,
  filterKeywords,
}: SongItemProps) => {
  const [isExpanded, setExpanded] = useState(false)

  // Info button is available to admins, room managers, and any user when the
  // song has multiple versions — they all have preference controls to show.
  const canViewInfo = isAdmin || isRoomManager || numMedia > 1

  const handleClick = () => {
    if (ignoreMouseup) ignoreMouseup = false
    // Queuing allowed even when song is already upcoming. Server enforces the
    // only hard rule: same user cannot queue the same song consecutively.
    else onSongQueue(songId)
  }
  const handleInfoClick = () => onSongInfo(songId)
  const handleStarClick = () => onSongStarClick(songId)

  const swipeHandlers = useSwipeable({
    onSwipedLeft: ({ event }) => {
      ignoreMouseup = event.type === 'mouseup'
      setExpanded(canViewInfo)
    },
    onSwipedRight: ({ event }) => {
      ignoreMouseup = event.type === 'mouseup'
      setExpanded(false)
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  })

  return (
    <div
      {...swipeHandlers}
      className={clsx(
        styles.container,
        isPlayed && styles.played,
        isUpcoming && styles.upcoming,
        isStarred && styles.starred,
        isExpanded && styles.expanded,
        artist && styles.withArtist,
      )}
    >
      <ToggleAnimation toggle={isUpcoming} className={styles.animateGlow}>
        <div className={styles.duration}>
          {formatDuration(duration)}
        </div>
        <div onClick={handleClick} className={styles.primary}>
          <div className={styles.title}>
            {filterKeywords?.length ? <Highlighter autoEscape textToHighlight={title} searchWords={filterKeywords} /> : title}
            {canViewInfo && numMedia > 1 && (
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

      <Buttons btnWidth={56} isExpanded={isExpanded}>
        <ButtonStar
          className={styles.btn}
          onClick={handleStarClick}
          isStarred={isStarred}
          count={numStars}
        />
        {canViewInfo && (
          <Button onClick={handleInfoClick} className={clsx(styles.btn, styles.info)} data-hide>
            <Icon icon='INFO_OUTLINE' />
          </Button>
        )}
      </Buttons>
    </div>
  )
}

export default SongItem
