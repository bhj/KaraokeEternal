import React, { useState } from 'react'
import clsx from 'clsx'
import { useSwipeable } from 'react-swipeable'
import Button from 'components/Button/Button'
import ButtonStar from 'components/ButtonStar/ButtonStar'
import Buttons from 'components/Buttons/Buttons'
import Icon from 'components/Icon/Icon'
import useToggleAnimation from 'lib/useToggleAnimation'
import Highlight from '../Highlight/Highlight'
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
  numStars: number
  numMedia: number
  highlight?: RegExp | null
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
  numStars,
  numMedia,
  highlight,
}: SongItemProps) => {
  const [expanded, setExpanded] = useState(false)
  const glow = useToggleAnimation(isUpcoming, styles.animateGlow)

  const handleClick = () => {
    if (ignoreMouseup) ignoreMouseup = false
    else if (!isUpcoming) onSongQueue(songId)
  }
  const handleInfoClick = () => onSongInfo(songId)
  const handleStarClick = () => onSongStarClick(songId)

  const swipeHandlers = useSwipeable({
    onSwipedLeft: ({ event }) => {
      ignoreMouseup = event.type === 'mouseup'
      setExpanded(isAdmin)
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
        artist && styles.withArtist,
      )}
    >
      <div className={clsx(styles.duration, glow.className)} onAnimationEnd={glow.onAnimationEnd}>
        {formatDuration(duration)}
      </div>
      <div onClick={handleClick} className={clsx(styles.primary, glow.className)} onAnimationEnd={glow.onAnimationEnd}>
        <div className={styles.title}>
          <Highlight text={title} pattern={highlight ?? null} />
          {isAdmin && numMedia > 1 && (
            <i>
              {' '}
              (
              {numMedia}
              )
            </i>
          )}
          {artist && (
            <div className={styles.artist}>
              <Highlight text={artist} pattern={highlight ?? null} />
            </div>
          )}
        </div>
      </div>

      <Buttons btnWidth={56} isExpanded={expanded}>
        <ButtonStar
          className={styles.btn}
          onClick={handleStarClick}
          isStarred={isStarred}
          count={numStars}
        />
        <Button onClick={handleInfoClick} className={clsx(styles.btn, styles.info)} data-hide aria-label='Info'>
          <Icon icon='INFO_OUTLINE' />
        </Button>
      </Buttons>
    </div>
  )
}

export default React.memo(SongItem)
