import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import SongItem from '../SongItem'

import { queueSong } from 'routes/Queue/modules/queue'
import { showSongInfo } from 'store/modules/songInfo'
import { toggleSongStarred } from 'store/modules/userStars'

interface SongListProps {
  artists: object
  filterKeywords: unknown[]
  queuedSongs: unknown[]
  showArtist: boolean
  songs: object
  songIds: unknown[]
  starredSongs: unknown[]
  starredSongCounts: object
}

const SongList = (props: SongListProps) => {
  const artists = useSelector(state => state.artists.entities)
  const songs = useSelector(state => state.songs.entities)
  const starredSongs = useSelector(state => ensureState(state.userStars).starredSongs)
  const starredSongCounts = useSelector(state => state.starCounts.songs)
  const isAdmin = useSelector(state => state.user.isAdmin)

  const dispatch = useDispatch()
  const handleSongQueue = useCallback(songId => dispatch(queueSong(songId)), [dispatch])
  const handleSongInfo = useCallback(songId => dispatch(showSongInfo(songId)), [dispatch])
  const handleSongStar = useCallback(songId => dispatch(toggleSongStarred(songId)), [dispatch])

  return props.songIds.map(songId => (
    <SongItem
      {...songs[songId]}
      artist={props.showArtist ? artists[songs[songId].artistId].name : ''}
      filterKeywords={props.filterKeywords}
      isQueued={props.queuedSongs.includes(songId)}
      isStarred={starredSongs.includes(songId)}
      isAdmin={isAdmin}
      key={songId}
      numStars={starredSongCounts[songId] || 0}
      onSongQueue={handleSongQueue}
      onSongStarClick={handleSongStar}
      onSongInfo={handleSongInfo}
    />
  ))
}

export default SongList
