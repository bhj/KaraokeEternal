import PropTypes from 'prop-types'
import React from 'react'
import SongList from '../SongList'
import Icon from 'components/Icon'
import Highlighter from 'react-highlight-words'
import './ArtistItem.css'

const ArtistItem = (props) => {
  const isChildQueued = props.artistSongIds.some(songId => props.queuedSongIds.includes(songId))

  return (
    <div style={props.style}>
      <div onClick={props.onArtistClick} styleName='container'>
        <div styleName='folderContainer'>
          <Icon icon='FOLDER' size={44} styleName='folderIcon' />
          {props.isExpanded &&
            <div styleName='expandedIcon'><Icon icon='EXPAND_LESS' size={24} /></div>
          }
          {!props.isExpanded &&
            <div styleName='count'>{props.artistSongIds.length}</div>
          }
        </div>
        <div styleName={isChildQueued ? 'name glow' : 'name'}>
          <Highlighter autoEscape textToHighlight={props.name} searchWords={props.filterKeywords} />
        </div>
      </div>
      {props.isExpanded &&
        <SongList
          songIds={props.artistSongIds}
          showArtist={false}
          filterKeywords={props.filterKeywords}
          queuedSongIds={props.queuedSongIds}
        />
      }
    </div>
  )
}

ArtistItem.propTypes = {
  artistSongIds: PropTypes.array.isRequired,
  queuedSongIds: PropTypes.array.isRequired,
  name: PropTypes.string.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  filterKeywords: PropTypes.array.isRequired,
  style: PropTypes.object,
  // actions
  onArtistClick: PropTypes.func.isRequired,
}

export default ArtistItem
