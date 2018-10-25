import PropTypes from 'prop-types'
import React from 'react'
import SongItem from '../SongItem'

const SongList = (props) => props.songIds.map(songId => (
  <SongItem
    {...props.songs[songId]}
    onSongQueue={props.queueSong}
    onSongStarClick={props.toggleSongStarred}
    onSongInfo={props.showSongInfo}
    isQueued={props.queuedSongIds.includes(songId)}
    isStarred={props.starredSongs.includes(songId)}
    isAdmin={props.isAdmin}
    filterKeywords={props.filterKeywords}
    artist={props.showArtist ? props.artists[props.songs[songId].artistId].name : ''}
    key={songId}
  />
))

SongList.propTypes = {
  artists: PropTypes.object.isRequired,
  songs: PropTypes.object.isRequired,
  songIds: PropTypes.array.isRequired,
  queuedSongIds: PropTypes.array.isRequired,
  starredSongs: PropTypes.array.isRequired,
  filterKeywords: PropTypes.array.isRequired,
  showArtist: PropTypes.bool.isRequired,
  // actions
  queueSong: PropTypes.func.isRequired,
  showSongInfo: PropTypes.func.isRequired,
  toggleSongStarred: PropTypes.func.isRequired,
}

export default SongList
