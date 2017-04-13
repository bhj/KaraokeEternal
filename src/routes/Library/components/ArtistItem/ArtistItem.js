import PropTypes from 'prop-types'
/* eslint react/no-unused-prop-types: 0 */
import React from 'react'
import SongItem from '../SongItem'
import classes from './ArtistItem.css'

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
      <div onClick={props.onArtistClick} className={classes.container + (isChildQueued ? ' ' + classes.hasQueued : '')}>
        <div className={classes.folder}>
          <i className={'material-icons ' + classes.icon}>folder</i>
          {props.isExpanded &&
            <div className={classes.arrowDown}><i className='material-icons'>keyboard_arrow_down</i></div>
          }
          {!props.isExpanded &&
            <div className={classes.count}>{props.songIds.length}</div>
          }
        </div>
        <div className={classes.name}>{props.name}</div>
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
