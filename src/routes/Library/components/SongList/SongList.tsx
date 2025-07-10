import React, { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { ensureState } from 'redux-optimistic-ui'
import SongItem from '../SongItem/SongItem'

import { queueSong } from 'routes/Queue/modules/queue'
import { showSongInfo } from 'store/modules/songInfo'
import { toggleSongStarred } from 'store/modules/userStars'

interface SongListProps {
  filterKeywords: string[]
  queuedSongs: number[]
  showArtist: boolean
  songIds: number[]
}

const SongList = (props: SongListProps) => {
  const artists = useAppSelector(state => state.artists.entities)
  const songs = useAppSelector(state => state.songs.entities)
  const starredSongs = useAppSelector(state => ensureState(state.userStars).starredSongs)
  const starredSongCounts = useAppSelector(state => state.starCounts.songs)
  const isAdmin = useAppSelector(state => state.user.isAdmin)

  const dispatch = useAppDispatch()
  const handleSongQueue = useCallback((songId: number) => dispatch(queueSong(songId)), [dispatch])
  const handleSongInfo = useCallback((songId: number) => dispatch(showSongInfo(songId)), [dispatch])
  const handleSongStar = useCallback((songId: number) => dispatch(toggleSongStarred(songId)), [dispatch])

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
