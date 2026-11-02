import React from 'react'
import clsx from 'clsx'
import SongList from '../SongList/SongList'
import Icon from 'components/Icon/Icon'
import useToggleAnimation from 'lib/useToggleAnimation'
import styles from './ArtistItem.css'

interface ArtistItemProps {
  artistSongIds: number[]
  isExpanded: boolean
  name: string
  numStars: number
  onArtistClick: () => void
  starredSongs: number[]
  style?: object
  upcomingSongs: Set<number>
  currentSongId: number | undefined
}

const ArtistItem = ({
  artistSongIds,
  isExpanded,
  name,
  onArtistClick,
  starredSongs,
  style,
  upcomingSongs,
  currentSongId,
}: ArtistItemProps): React.ReactElement => {
  const isChildUpcoming = artistSongIds.some(songId =>
    upcomingSongs.has(songId) || currentSongId === songId,
  )
  const isChildStarred = artistSongIds.some(songId => starredSongs.includes(songId))
  const glow = useToggleAnimation(isChildUpcoming, styles.animateGlow)

  return (
    <div style={style} translate='no'>
      <div onClick={onArtistClick} className={clsx(styles.container, isChildStarred && styles.hasStarred)}>
        <div className={styles.folderContainer}>
          <Icon icon='FOLDER' />
          {isExpanded && (
            <div className={styles.iconChevronContainer}>
              <Icon icon='CHEVRON_DOWN' />
            </div>
          )}
          {!isExpanded && <div className={styles.count}>{artistSongIds.length}</div>}
        </div>
        <div
          className={clsx(styles.name, isChildUpcoming && styles.isChildUpcoming, glow.className)}
          onAnimationEnd={glow.onAnimationEnd}
        >
          {name}
        </div>
      </div>

      {isExpanded && (
        <SongList
          songIds={artistSongIds}
          showArtist={false}
        />
      )}
    </div>
  )
}

export default ArtistItem
