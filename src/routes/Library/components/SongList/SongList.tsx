import React, { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { ensureState } from 'redux-optimistic-ui'
import { Artist, Song } from 'shared/types'
import SongItem from '../SongItem/SongItem'

import { queueSong } from 'routes/Queue/modules/queue'
import { showSongInfo } from 'store/modules/songInfo'
import { toggleSongStarred } from 'store/modules/userStars'

interface SongListProps {
  artists: Record<PropertyKey, Artist>
  filterKeywords: string[]
  queuedSongs: number[]
  showArtist: boolean
  songs: Record<PropertyKey, Song>
  songIds: number[]
  starredSongs: number[]
  starredSongCounts: Record<PropertyKey, number>
}

const SongList = (props: SongListProps) => {
  const artists = useAppSelector(state => state.artists.entities)
  const songs = useAppSelector(state => state.songs.entities)
  const starredSongs = useAppSelector(state => ensureState(state.userStars).starredSongs)
  const starredSongCounts = useAppSelector(state => state.starCounts.songs)
  const isAdmin = useAppSelector(state => state.user.isAdmin)

  const dispatch = useAppDispatch()
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
