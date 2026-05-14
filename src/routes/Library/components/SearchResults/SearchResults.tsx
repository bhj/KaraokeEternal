import React, { useCallback, useMemo, useRef } from 'react'
import { ensureState } from 'redux-optimistic-ui'
import type { Artist, Song } from 'shared/types'
import { RootState } from 'store/store'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { queueSong } from 'routes/Queue/modules/queue'
import { showSongInfo } from 'store/modules/songInfo'
import { toggleSongStarred } from 'store/modules/userStars'
import getSearchResults from '../../selectors/getSearchResults'
import getSongsStatus from '../../selectors/getSongsStatus'
import buildHighlightPattern from '../Highlight/buildHighlightPattern'
import PaddedList from 'components/PaddedList/PaddedList'
import SongItem from '../SongItem/SongItem'
import type { ListImperativeAPI, RowComponentProps } from 'react-window'
import styles from './SearchResults.css'

const ROW_HEIGHT_RESULT_HEADING = 24
const ROW_HEIGHT_SONG_WITH_ARTIST = 68 // 64px + 4px margin

interface SearchResultsProps {
  ui: RootState['ui']
}

interface CustomRowProps {
  highlight: RegExp | null
  filterStarred: boolean
  songsResult: number[]
  songs: Record<number, Song>
  artists: Record<number, Artist>
  starredSongs: number[]
  starredSongCounts: Record<number, number>
  isAdmin: boolean
  played: Set<number>
  upcoming: Set<number>
  currentSongId: number | undefined
  onSongQueue: (id: number) => void
  onSongInfo: (id: number) => void
  onSongStar: (id: number) => void
}

const RowComponent = ({
  index,
  style,
  highlight,
  filterStarred,
  songsResult,
  songs,
  artists,
  starredSongs,
  starredSongCounts,
  isAdmin,
  played,
  upcoming,
  currentSongId,
  onSongQueue,
  onSongInfo,
  onSongStar,
}: RowComponentProps<CustomRowProps>) => {
  if (index === 0) {
    return (
      <div key='songsHeading' style={style} className={styles.songsHeading}>
        {songsResult.length}
        {' '}
        {filterStarred ? 'starred ' : ''}
        {songsResult.length === 1 ? 'song' : 'songs'}
      </div>
    )
  }

  const songId = songsResult[index - 1]
  const song = songs[songId]
  if (!song) return null

  return (
    <div style={style}>
      <SongItem
        {...song}
        artist={artists[song.artistId]?.name ?? ''}
        highlight={highlight}
        isPlayed={played.has(songId)}
        isUpcoming={upcoming.has(songId) || currentSongId === songId}
        isStarred={starredSongs.includes(songId)}
        isAdmin={isAdmin}
        numStars={starredSongCounts[songId] || 0}
        onSongQueue={onSongQueue}
        onSongStarClick={onSongStar}
        onSongInfo={onSongInfo}
      />
    </div>
  )
}

const SearchResults = ({ ui }: SearchResultsProps) => {
  const dispatch = useAppDispatch()
  const { filterStr, filterStarred } = useAppSelector(state => state.library)
  const { songsResult } = useAppSelector(getSearchResults)
  const artists = useAppSelector(state => state.artists.entities)
  const songs = useAppSelector(state => state.songs.entities)
  const starredSongs = useAppSelector(state => ensureState(state.userStars).starredSongs)
  const starredSongCounts = useAppSelector(state => state.starCounts.songs)
  const isAdmin = useAppSelector(state => state.user.isAdmin)
  const { played, upcoming, current } = useAppSelector(getSongsStatus)

  const listRef = useRef<ListImperativeAPI | null>(null)
  const highlight = useMemo(() => buildHighlightPattern(filterStr), [filterStr])

  const onSongQueue = useCallback((id: number) => dispatch(queueSong(id)), [dispatch])
  const onSongInfo = useCallback((id: number) => dispatch(showSongInfo(id)), [dispatch])
  const onSongStar = useCallback((id: number) => dispatch(toggleSongStarred(id)), [dispatch])

  const rowHeight = useCallback((index: number) => {
    if (index === 0) return ROW_HEIGHT_RESULT_HEADING
    return ROW_HEIGHT_SONG_WITH_ARTIST
  }, [])

  const handleRef = (ref: ListImperativeAPI) => {
    if (ref) listRef.current = ref
  }

  return (
    <PaddedList
      rowComponent={RowComponent}
      rowProps={{
        filterStarred,
        highlight,
        songsResult,
        songs,
        artists,
        starredSongs,
        starredSongCounts,
        isAdmin,
        played,
        upcoming,
        currentSongId: current,
        onSongQueue,
        onSongInfo,
        onSongStar,
      }}
      rowHeight={rowHeight}
      numRows={1 + songsResult.length}
      paddingTop={ui.headerHeight}
      paddingRight={4}
      paddingBottom={ui.footerHeight}
      height={ui.innerHeight}
      onRef={handleRef}
    />
  )
}

export default SearchResults
