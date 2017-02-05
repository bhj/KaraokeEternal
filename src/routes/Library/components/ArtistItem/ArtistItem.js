import React, { PropTypes } from 'react'
import SongItem from '../SongItem'
import classes from './ArtistItem.css'

const ArtistItem = (props) => {
  let children = []
  let isChildQueued = false

  props.songIds.forEach(songId => {
    if (props.queuedSongIds.indexOf(songId) !== -1) {
      isChildQueued = true
    }

    if (props.isExpanded) {
      children.push(
        <SongItem
          {...props.songs.entities[songId]}
          onSongClick={() => props.onSongClick(songId)}
          isQueued={props.queuedSongIds.indexOf(songId) !== -1}
          key={songId}
        />
      )
    }
  })

  return (
    <div style={props.style}>
      <div onClick={props.onArtistClick} className={classes.container + (isChildQueued ? ' ' + classes.hasQueued : '')}>
        <div className={classes.countIcon}>{props.songIds.length}</div>
        <div className={classes.name}>{props.name}</div>
      </div>
      {children}
    </div>
  )
}

ArtistItem.propTypes = {
  songs: PropTypes.object.isRequired,
  songIds: PropTypes.array.isRequired,
  queuedSongIds: PropTypes.array.isRequired,
  name: PropTypes.string.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onArtistClick: PropTypes.func.isRequired,
  onSongClick: PropTypes.func.isRequired,
  style: PropTypes.object,
}

export default ArtistItem
