import PropTypes from 'prop-types'
/* eslint react/no-unused-prop-types: 0 */
import React from 'react'
import SongItem from '../SongItem'
import './ArtistItem.css'

const ArtistItem = (props) => {
  let children = []
  let isChildQueued = false

  props.songIds.forEach(songId => {
    if (props.queuedSongs.includes(songId)) {
      isChildQueued = true
    }

    if (props.isExpanded) {
      children.push(
        <SongItem
          {...props.songs.entities[songId]}
          onSongClick={() => props.onSongClick(songId)}
          onSongStarClick={() => props.onSongStarClick(songId)}
          isQueued={props.queuedSongs.includes(songId)}
          isStarred={props.starredSongs.includes(songId)}
          key={songId}
        />
      )
    }
  })

  return (
    <div style={props.style}>
      <div onClick={props.onArtistClick} styleName={'container' + (isChildQueued ? ' hasQueued' : '')}>
        <div styleName='folder'>
          <i className='material-icons' styleName='icon'>folder</i>
          {props.isExpanded &&
            <div styleName='arrowDown'><i className='material-icons'>keyboard_arrow_down</i></div>
          }
          {!props.isExpanded &&
            <div styleName='count'>{props.songIds.length}</div>
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
  songIds: PropTypes.array.isRequired,
  queuedSongs: PropTypes.array.isRequired,
  starredSongs: PropTypes.array.isRequired,
  name: PropTypes.string.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onArtistClick: PropTypes.func.isRequired,
  onSongClick: PropTypes.func.isRequired,
  onSongStarClick: PropTypes.func.isRequired,
  style: PropTypes.object,
}

export default ArtistItem
