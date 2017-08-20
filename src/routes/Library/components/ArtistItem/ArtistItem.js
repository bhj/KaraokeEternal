import PropTypes from 'prop-types'
/* eslint react/no-unused-prop-types: 0 */
import React from 'react'
import SongItem from '../SongItem'
import Icon from 'components/Icon'
import './ArtistItem.css'

const ArtistItem = (props) => {
  let children = []
  let isChildQueued = false

  props.artistMediaIds.forEach(mediaId => {
    if (props.queuedMediaIds.includes(mediaId)) {
      isChildQueued = true
    }

    if (props.isExpanded) {
      children.push(
        <SongItem
          {...props.media.entities[mediaId]}
          onSongClick={() => props.onSongClick(mediaId)}
          onSongStarClick={() => props.onSongStarClick(mediaId)}
          isQueued={props.queuedMediaIds.includes(mediaId)}
          isStarred={props.starredSongs.includes(mediaId)}
          key={mediaId}
        />
      )
    }
  })

  return (
    <div style={props.style}>
      <div onClick={props.onArtistClick} styleName={'container' + (isChildQueued ? ' hasQueued' : '')}>
        <div styleName='folderContainer'>
          <Icon icon='FOLDER' size={40} styleName='folderIcon' />
          {props.isExpanded &&
            <div styleName='expandedIcon'><Icon icon='EXPAND_LESS' size={24} /></div>
          }
          {!props.isExpanded &&
            <div styleName='count'>{props.artistMediaIds.length}</div>
          }
        </div>
        <div styleName='name'>{props.name}</div>
      </div>
      {children}
    </div>
  )
}

ArtistItem.propTypes = {
  media: PropTypes.object.isRequired,
  artistMediaIds: PropTypes.array.isRequired,
  queuedMediaIds: PropTypes.array.isRequired,
  starredSongs: PropTypes.array.isRequired,
  name: PropTypes.string.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onArtistClick: PropTypes.func.isRequired,
  onSongClick: PropTypes.func.isRequired,
  onSongStarClick: PropTypes.func.isRequired,
  style: PropTypes.object,
}

export default ArtistItem
