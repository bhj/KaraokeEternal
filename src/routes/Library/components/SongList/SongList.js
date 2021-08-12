import PropTypes from 'prop-types'
import React from 'react'
import SongItem from '../SongItem'

const SongList = (props) => props.songIds.map(songId => {
  const song = props.songs[songId]
  const title = song.title
  const artist = props.showArtist ? props.artists[song.artistId].name : ''
  const isQueued = props.queuedSongs.includes(songId)
  const wasPlayed = props.playedSongs.includes(songId)

  return (
    <SongItem
      {...song}
      artist={artist}
      filterKeywords={props.filterKeywords}
      isQueued={isQueued}
      isStarred={props.starredSongs.includes(songId)}
      isAdmin={props.isAdmin}
      key={songId}
      numStars={props.starredSongCounts[songId] || 0}
      onSongQueue={songId => {
        let songDescription = `"${title}"`
        if (artist) {
          songDescription = `${songDescription} by ${artist}`
        }
        const confirmAdd = true
        const allowDupsInQueue = true
        const warnDupsInQueue = true
        if ((isQueued || wasPlayed) && !allowDupsInQueue) {
          window.alert(`${songDescription} ${wasPlayed ? 'was already played' : 'is already in the song queue'}`)
          return
        }

        let confirm = true
        if ((isQueued || wasPlayed) && warnDupsInQueue) {
          confirm = window.confirm(`${songDescription} ${wasPlayed ? 'was already played' : 'is already in the song queue'}. Add it again?`)
        } else if (confirmAdd) {
          confirm = window.confirm(`Would you like to perform ${songDescription}?`)
        }
        if (confirm) {
          props.queueSong(songId)
        }
      }}
      onSongStarClick={props.toggleSongStarred}
      onSongInfo={props.showSongInfo}
    />
  )
})

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
