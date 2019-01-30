import PropTypes from 'prop-types'
import React from 'react'
import SongItem from '../SongItem'

const SongList = (props) => props.songIds.map(songId => (
  <SongItem
    {...props.songs[songId]}
    artist={props.showArtist ? props.artists[props.songs[songId].artistId].name : ''}
    filterKeywords={props.filterKeywords}
    isQueued={props.queuedSongs.includes(songId)}
    isStarred={props.starredSongs.includes(songId)}
    isAdmin={props.isAdmin}
    key={songId}
    numStars={props.starredSongCounts[songId] || 0}
    onSongQueue={props.queueSong}
    onSongStarClick={props.toggleSongStarred}
    onSongInfo={props.showSongInfo}
  />
))

SongList.propTypes = {
  artists: PropTypes.object.isRequired,
  filterKeywords: PropTypes.array.isRequired,
  queuedSongs: PropTypes.array.isRequired,
  showArtist: PropTypes.bool.isRequired,
  songs: PropTypes.object.isRequired,
  songIds: PropTypes.array.isRequired,
  starredSongs: PropTypes.array.isRequired,
  starredSongCounts: PropTypes.object.isRequired,
  // actions
  queueSong: PropTypes.func.isRequired,
  showSongInfo: PropTypes.func.isRequired,
  toggleSongStarred: PropTypes.func.isRequired,
}

export default SongList
