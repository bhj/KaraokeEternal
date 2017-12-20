import PropTypes from 'prop-types'
/* eslint react/no-unused-prop-types: 0 */
import React from 'react'
import SongItem from '../SongItem'
import Icon from 'components/Icon'
import './ArtistItem.css'

const ArtistItem = (props) => {
  let children = []
  let isChildQueued = false

  props.songs.forEach(song => {
    if (props.queuedMediaIds.includes(song.mediaId)) {
      isChildQueued = true
    }

    if (props.isExpanded) {
      children.push(
        <SongItem
          {...song}
          onSongClick={() => props.onSongClick(song.mediaId)}
          onSongStarClick={() => props.onSongStarClick(song.mediaId)}
          isQueued={props.queuedMediaIds.includes(song.mediaId)}
          isStarred={props.starredSongs.includes(song.mediaId)}
          key={song.mediaId}
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
            <div styleName='count'>{props.songs.length}</div>
          }
        </div>
        <div styleName='name'>{props.name}</div>
      </div>
      {children}
    </div>
  )
}

ArtistItem.propTypes = {
  name: PropTypes.string.isRequired,
  songs: PropTypes.array.isRequired,
  queuedMediaIds: PropTypes.array.isRequired,
  starredSongs: PropTypes.array.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onArtistClick: PropTypes.func.isRequired,
  onSongClick: PropTypes.func.isRequired,
  onSongStarClick: PropTypes.func.isRequired,
  style: PropTypes.object,
}

export default ArtistItem
