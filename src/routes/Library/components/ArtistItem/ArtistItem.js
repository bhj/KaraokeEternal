import PropTypes from 'prop-types'
/* eslint react/no-unused-prop-types: 0 */
import React from 'react'
import SongItem from '../SongItem'
import Icon from 'components/Icon'
import './ArtistItem.css'

const ArtistItem = (props) => {
  let children = []
  let isChildQueued = false

  props.artistSongIds.forEach(songId => {
    if (props.queuedSongIds.includes(songId)) {
      isChildQueued = true
    }

    if (props.isExpanded) {
      children.push(
        <SongItem
          {...props.songs[songId]}
          onSongClick={() => props.onSongClick(songId)}
          onSongStarClick={() => props.onSongStarClick(songId)}
          isQueued={props.queuedSongIds.includes(songId)}
          isStarred={props.starredSongs.includes(songId)}
          key={songId}
        />
      )
    }
  })

  return (
    <div style={props.style}>
      <div onClick={props.onArtistClick} styleName={'container' + (isChildQueued ? ' hasQueued' : '')}>
        <div styleName='folderContainer'>
          <Icon icon='FOLDER' size={44} styleName='folderIcon' />
          {props.isExpanded &&
            <div styleName='expandedIcon'><Icon icon='EXPAND_LESS' size={24} /></div>
          }
          {!props.isExpanded &&
            <div styleName='count'>{props.artistSongIds.length}</div>
          }
        </div>
        <div styleName='name'>{props.name}</div>
      </div>
      {children}
    </div>
  )
}

ArtistItem.propTypes = {
  songs: PropTypes.object.isRequired,
  artistSongIds: PropTypes.array.isRequired,
  queuedSongIds: PropTypes.array.isRequired,
  starredSongs: PropTypes.array.isRequired,
  name: PropTypes.string.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onArtistClick: PropTypes.func.isRequired,
  onSongClick: PropTypes.func.isRequired,
  onSongStarClick: PropTypes.func.isRequired,
  style: PropTypes.object,
}

export default ArtistItem
