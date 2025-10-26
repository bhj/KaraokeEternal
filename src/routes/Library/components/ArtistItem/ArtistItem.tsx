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
  queuedSongs: number[]
  starredSongs: number[]
  style?: object
}

const ArtistItem = ({
  artistSongIds,
  filterKeywords,
  isExpanded,
  name,
  onArtistClick,
  queuedSongs,
  starredSongs,
  style,
}: ArtistItemProps): React.ReactElement => {
  const isChildQueued = artistSongIds.some(songId => queuedSongs.includes(songId))
  const isChildStarred = artistSongIds.some(songId => starredSongs.includes(songId))

  return (
    <div style={style}>
      <div onClick={onArtistClick} className={clsx(styles.container, isChildStarred && styles.hasStarred)}>
        <div className={styles.folderContainer}>
          <Icon icon='FOLDER' size={44} />
          {isExpanded && (
            <div className={styles.iconChevron}>
              <Icon icon='CHEVRON_DOWN' size={24} />
            </div>
          )}
          {!isExpanded && <div className={styles.count}>{artistSongIds.length}</div>}
        </div>
        <ToggleAnimation toggle={isChildQueued} className={styles.animateGlow}>
          <div className={clsx(styles.name, isChildQueued && styles.isChildQueued)}>
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
