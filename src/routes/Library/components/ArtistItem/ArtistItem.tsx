import React from 'react'
import clsx from 'clsx'
import SongList from '../SongList/SongList'
import Icon from 'components/Icon/Icon'
import ToggleAnimation from 'components/ToggleAnimation/ToggleAnimation'
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
        <ToggleAnimation toggle={isChildUpcoming} className={styles.animateGlow}>
          <div className={clsx(styles.name, isChildUpcoming && styles.isChildUpcoming)}>
            {name}
          </div>
        </ToggleAnimation>
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
