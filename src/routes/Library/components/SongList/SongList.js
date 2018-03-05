import PropTypes from 'prop-types'
import React from 'react'
import SongItem from '../SongItem'
const SONG_HEIGHT = 44
const SONG_ARTIST_HEIGHT = 60

const SongList = (props) => props.songIds.map(songId => (
  <SongItem
    {...props.songs[songId]}
    onSongClick={() => props.queueSong(songId)}
    onSongStarClick={() => props.toggleSongStarred(songId)}
    onSongInfoClick={() => props.showSongInfo(songId)}
    isQueued={props.queuedSongIds.includes(songId)}
    isStarred={props.starredSongs.includes(songId)}
    isAdmin={props.isAdmin}
    filterKeywords={props.filterKeywords}
    artist={props.showArtist ? props.artists[props.songs[songId].artistId].name : ''}
    style={{ height: props.showArtist ? SONG_ARTIST_HEIGHT : SONG_HEIGHT }}
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
  toggleSongStarred: PropTypes.func.isRequired,
  showSongInfo: PropTypes.func.isRequired,
}

export default SongList
