import React from 'react'
import clsx from 'clsx'
import Highlighter from 'react-highlight-words'
import SongList from '../SongList/SongList'
import Icon from 'components/Icon/Icon'
import ToggleAnimation from 'components/ToggleAnimation/ToggleAnimation'
import styles from './ArtistItem.css'

interface ArtistItemProps {
  artistSongIds: number[]
  filterKeywords?: string[]
  isExpanded: boolean
  name: string
  numStars: number
  onArtistClick: () => void
  starredSongs: number[]
  style?: object
  upcomingSongs: number[]
}

const ArtistItem = ({
  artistSongIds,
  filterKeywords,
  isExpanded,
  name,
  onArtistClick,
  starredSongs,
  style,
  upcomingSongs,
}: ArtistItemProps): React.ReactElement => {
  const isChildUpcoming = artistSongIds.some(songId => upcomingSongs.includes(songId))
  const isChildStarred = artistSongIds.some(songId => starredSongs.includes(songId))

  return (
    <div style={style}>
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
            {filterKeywords?.length ? <Highlighter autoEscape textToHighlight={name} searchWords={filterKeywords} /> : name}
          </div>
        </ToggleAnimation>
      </div>

      {isExpanded && (
        <SongList
          songIds={artistSongIds}
          showArtist={false}
          filterKeywords={filterKeywords}
        />
      )}
    </div>
  )
}

export default ArtistItem
