import React from 'react'
import SongList from '../SongList'
import Icon from 'components/Icon'
import Highlighter from 'react-highlight-words'
import ToggleAnimation from 'components/ToggleAnimation'
import styles from './ArtistItem.css'

interface ArtistItemProps {
  artistId: number
  artistSongIds: PropertyKey[]
  filterKeywords: string[]
  isExpanded: boolean
  name: string
  numStars: number
  queuedSongs: PropertyKey[]
  starredSongs: PropertyKey[]
  style?: object
  // actions
  onArtistClick(...args: unknown[]): unknown
}

class ArtistItem extends React.Component<ArtistItemProps> {
  render () {
    const { props } = this
    const isChildQueued = props.artistSongIds.some(songId => props.queuedSongs.includes(songId))
    const isChildStarred = props.artistSongIds.some(songId => props.starredSongs.includes(songId))

    return (
      <div style={props.style}>
        <div onClick={this.handleArtistClick} className={props.isExpanded ? styles.containerExpanded : styles.container}>
          <div className={isChildStarred ? styles.folderStarred : styles.folder}>
            <Icon icon='FOLDER' size={44}/>
            {props.isExpanded &&
              <div className={isChildStarred ? styles.iconExpandedStarred : styles.iconExpanded}>
                <Icon icon='CHEVRON_DOWN' size={24} />
              </div>
            }
            {!props.isExpanded &&
              <div className={styles.count}>{props.artistSongIds.length}</div>
            }
          </div>
          <ToggleAnimation toggle={isChildQueued} className={styles.animateGlow}>
            <div className={`${styles.name} ${isChildQueued ? styles.isChildQueued : ''}`}>
              <Highlighter autoEscape textToHighlight={props.name} searchWords={props.filterKeywords} />
            </div>
          </ToggleAnimation>
        </div>

        {props.isExpanded &&
          <SongList
            songIds={props.artistSongIds}
            showArtist={false}
            filterKeywords={props.filterKeywords}
            queuedSongs={props.queuedSongs}
          />
        }
      </div>
    )
  }

  handleArtistClick = () => {
    this.props.onArtistClick(this.props.artistId)
  }
}

export default ArtistItem
