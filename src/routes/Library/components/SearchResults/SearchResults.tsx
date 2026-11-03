import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { ensureState } from 'redux-optimistic-ui'
import type { Artist, Song } from 'shared/types'
import { RootState } from 'store/store'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { queueSong } from 'routes/Queue/modules/queue'
import { showSongInfo } from 'store/modules/songInfo'
import { toggleSongStarred } from 'store/modules/userStars'
import {
  providerFetchKey,
  providerFetchRequest,
  providerSearchCancel,
  providerSearchRequest,
  scrollSearchResults,
  type ProviderFetchView,
} from '../../modules/library'
import getSearchResults from '../../selectors/getSearchResults'
import getSongsStatus from '../../selectors/getSongsStatus'
import buildHighlightPattern from '../Highlight/buildHighlightPattern'
import Button from 'components/Button/Button'
import Icon from 'components/Icon/Icon'
import PaddedList from 'components/PaddedList/PaddedList'
import ProviderResultItem, { type ProviderFetchItem } from '../ProviderResultItem/ProviderResultItem'
import SongItem from '../SongItem/SongItem'
import Spinner from 'components/Spinner/Spinner'
import type { ProviderSearchError, ProviderSearchResult } from 'shared/types'
import type { ListImperativeAPI, RowComponentProps } from 'react-window'
import styles from './SearchResults.css'

const ROW_HEIGHT_RESULT_HEADING = 24
const ROW_HEIGHT_SONG_WITH_ARTIST = 68 // 64px + 4px margin
const ROW_HEIGHT_PROVIDER_SPINNER = 52
const ROW_HEIGHT_PROVIDER_SEARCH_BUTTON = 64

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
  userId: number | null
  played: Set<number>
  upcoming: Set<number>
  currentSongId: number | undefined
  providerResults: ProviderSearchResult[]
  providerErrors: ProviderSearchError[]
  providerNames: Record<number, string | undefined>
  providerFetches: Record<string, ProviderFetchView>
  isProviderSearchActive: boolean
  isProviderSearchDone: boolean
  showOnlineSection: boolean
  showProviderSearchButton: boolean
  providerSearchBtnIdx: number
  providerHeadingIdx: number
  onSongQueue: (id: number) => void
  onSongInfo: (id: number) => void
  onSongStar: (id: number) => void
  onFetch: (item: ProviderFetchItem) => void
  onProviderSearch: () => void
  onProviderSearchCancel: () => void
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
  userId,
  played,
  upcoming,
  currentSongId,
  providerResults,
  providerErrors,
  providerNames,
  providerFetches,
  isProviderSearchActive,
  isProviderSearchDone,
  showOnlineSection,
  showProviderSearchButton,
  providerSearchBtnIdx,
  providerHeadingIdx,
  onSongQueue,
  onSongInfo,
  onSongStar,
  onFetch,
  onProviderSearch,
  onProviderSearchCancel,
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

  if (index >= 1 && index <= songsResult.length) {
    const songId = songsResult[index - 1]
    const song = songs[songId]
    if (!song) return null

    // keyed so a recycled row remounts rather than updates when it shows a
    // different song; otherwise its queued/starred animations would replay
    return (
      <div key={songId} style={style}>
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

  if (showProviderSearchButton && index === providerSearchBtnIdx) {
    return (
      <div style={style} className={styles.providerSearchButton}>
        <Button variant='primary' onClick={onProviderSearch}>
          {isProviderSearchDone ? 'Search Again' : 'Find More Songs'}
        </Button>
      </div>
    )
  }

  if (!showOnlineSection) return null

  if (index === providerHeadingIdx) {
    return (
      <div key='providerHeading' style={style} className={styles.providerHeading}>
        <span>
          {providerResults.length === 0
            ? 'No more results'
            : `${providerResults.length} more ${providerResults.length === 1 ? 'result' : 'results'}`}
        </span>
        {isProviderSearchActive && (
          <button type='button' className={styles.providerHeadingCancel} onClick={onProviderSearchCancel}>
            (Cancel)
          </button>
        )}
      </div>
    )
  }

  const providerResultsStart = providerHeadingIdx + 1
  const providerErrorsStart = providerResultsStart + providerResults.length
  const providerErrorsEnd = providerErrorsStart + providerErrors.length

  if (index >= providerResultsStart && index < providerErrorsStart) {
    const result = providerResults[index - providerResultsStart]
    const fetchView = providerFetches[providerFetchKey(result.providerId, result.id)]
    return (
      <div style={style} key={`${result.providerId}:${result.id}`}>
        <ProviderResultItem
          providerId={result.providerId}
          itemId={result.id}
          title={result.title}
          artist={result.artist}
          source={result.source}
          iconUrl={result.iconUrl}
          duration={result.duration}
          highlight={highlight}
          isAdmin={isAdmin}
          userId={userId}
          fetchView={fetchView}
          onFetch={onFetch}
        />
      </div>
    )
  }

  if (index >= providerErrorsStart && index < providerErrorsEnd) {
    const err = providerErrors[index - providerErrorsStart]
    return (
      <div style={style} key={`err:${err.providerId}`}>
        <div className={styles.providerError} role='alert'>
          <div className={styles.providerErrorIcon}>
            <Icon icon='ALERT_OUTLINE' size={24} />
          </div>
          <div className={styles.providerErrorText}>
            {providerNames[err.providerId] ?? 'Provider'}
            <div className={styles.providerErrorMessage} title={err.message}>
              {err.message}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isProviderSearchActive && index === providerErrorsEnd) {
    return (
      <div key='providerSpinner' style={style}>
        <Spinner />
      </div>
    )
  }

  return null
}

const SearchResults = ({ ui }: SearchResultsProps) => {
  const dispatch = useAppDispatch()
  const {
    filterStr,
    filterStarred,
    isProviderSearchActive,
    providerSearchQuery,
    providerResults,
    providerErrors,
    providerFetches,
  } = useAppSelector(state => state.library)
  const { songsResult } = useAppSelector(getSearchResults)
  const artists = useAppSelector(state => state.artists.entities)
  const songs = useAppSelector(state => state.songs.entities)
  const starredSongs = useAppSelector(state => ensureState(state.userStars).starredSongs)
  const starredSongCounts = useAppSelector(state => state.starCounts.songs)
  const isAdmin = useAppSelector(state => state.user.isAdmin)
  const { played, upcoming, current } = useAppSelector(getSongsStatus)
  const scrollOffset = useAppSelector(state => state.library.searchScrollOffset)
  const user = useAppSelector(state => state.user)
  const providers = useAppSelector(state => state.prefs.providers)

  const lastScrollOffsetRef = useRef(scrollOffset)
  const listRef = useRef<ListImperativeAPI | null>(null)
  const isProviderSearchActiveRef = useRef(isProviderSearchActive)
  useEffect(() => {
    isProviderSearchActiveRef.current = isProviderSearchActive
  }, [isProviderSearchActive])

  const highlight = useMemo(() => buildHighlightPattern(filterStr), [filterStr])
  const trimmedFilter = filterStr.trim()

  // Hide already-completed entries: the song is in the local library now, so
  // the local row above takes priority and we avoid re-triggering provider work.
  const filteredProviderResults = useMemo(
    () => providerResults.filter(
      r => providerFetches[providerFetchKey(r.providerId, r.id)]?.status !== 'complete',
    ),
    [providerResults, providerFetches],
  )

  // enabled song providers offered for this query: those whose maxLibraryResults is null
  // (always) or at least the number of local matches (none while filtering by starred
  // songs, which are local by definition)
  const eligibleProviderIds = useMemo(
    () => filterStarred
      ? []
      : providers.result.filter((id) => {
          const provider = providers.entities[id]
          const song = provider?.prefs.types.song
          if (!provider?.prefs.enabled || !song?.enabled) return false
          return song.maxLibraryResults === null || songsResult.length <= song.maxLibraryResults
        }),
    [providers, songsResult.length, filterStarred],
  )

  const providerNames = useMemo(
    () => Object.fromEntries(providers.result.map(id => [id, providers.entities[id]?.name])),
    [providers],
  )

  const onSongQueue = useCallback((id: number) => dispatch(queueSong(id)), [dispatch])
  const onSongInfo = useCallback((id: number) => dispatch(showSongInfo(id)), [dispatch])
  const onSongStar = useCallback((id: number) => dispatch(toggleSongStarred(id)), [dispatch])

  const onFetch = useCallback(
    (item: ProviderFetchItem) => {
      if (user.userId === null || user.name === null) return
      dispatch(providerFetchRequest({
        ...item,
        userId: user.userId,
        userDisplayName: user.name,
        userDateUpdated: user.dateUpdated,
      }))
    },
    [dispatch, user.userId, user.name, user.dateUpdated],
  )

  const onProviderSearch = useCallback(() => {
    if (trimmedFilter.length === 0 || eligibleProviderIds.length === 0) return
    dispatch(providerSearchRequest({ query: trimmedFilter, providerIds: eligibleProviderIds }))
  }, [dispatch, trimmedFilter, eligibleProviderIds])

  const onProviderSearchCancel = useCallback(() => dispatch(providerSearchCancel()), [dispatch])

  // cancel any in-flight provider search when SearchResults unmounts
  useEffect(() => {
    return () => {
      if (isProviderSearchActiveRef.current) dispatch(providerSearchCancel())
    }
  }, [dispatch])

  // a search for exactly what's in the box has run to completion (or was canceled),
  // so an empty online section means "nothing found" rather than "not searched yet"
  const isProviderSearchDone = trimmedFilter.length > 0
    && providerSearchQuery === trimmedFilter
    && !isProviderSearchActive

  // hidden (not cleared) while filtering by starred songs, so it returns when toggled off
  const showOnlineSection = !filterStarred && (isProviderSearchActive || isProviderSearchDone
    || filteredProviderResults.length > 0 || providerErrors.length > 0)
  // once a search turns up results there's nothing to prompt for; the row only
  // persists to offer a retry when it came back empty
  const showProviderSearchButton = eligibleProviderIds.length > 0 && trimmedFilter.length > 0 && !isProviderSearchActive
    && !(isProviderSearchDone && filteredProviderResults.length > 0)
  const providerHeadingIdx = 1 + songsResult.length
  const onlineRowCount = showOnlineSection
    ? 1 + (isProviderSearchActive ? 1 : 0) + filteredProviderResults.length + providerErrors.length
    : 0
  const buttonRowCount = showProviderSearchButton ? 1 : 0
  const numRows = 1 + songsResult.length + onlineRowCount + buttonRowCount
  const providerSearchBtnIdx = showProviderSearchButton ? numRows - 1 : -1

  const rowHeight = useCallback((index: number) => {
    if (index === 0) return ROW_HEIGHT_RESULT_HEADING
    if (index >= 1 && index <= songsResult.length) return ROW_HEIGHT_SONG_WITH_ARTIST
    if (showProviderSearchButton && index === providerSearchBtnIdx) return ROW_HEIGHT_PROVIDER_SEARCH_BUTTON

    if (!showOnlineSection) return 0
    if (index === providerHeadingIdx) return ROW_HEIGHT_RESULT_HEADING

    const providerResultsStart = providerHeadingIdx + 1
    const providerErrorsStart = providerResultsStart + filteredProviderResults.length
    const providerErrorsEnd = providerErrorsStart + providerErrors.length

    if (index >= providerResultsStart && index < providerErrorsEnd) return ROW_HEIGHT_SONG_WITH_ARTIST
    if (isProviderSearchActive && index === providerErrorsEnd) return ROW_HEIGHT_PROVIDER_SPINNER

    return 0
  }, [
    songsResult.length,
    showOnlineSection,
    showProviderSearchButton,
    providerSearchBtnIdx,
    providerHeadingIdx,
    filteredProviderResults.length,
    providerErrors.length,
    isProviderSearchActive,
  ])

  useEffect(() => {
    return () => {
      dispatch(scrollSearchResults(lastScrollOffsetRef.current))
    }
  }, [dispatch])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    lastScrollOffsetRef.current = e.currentTarget.scrollTop
  }

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
        userId: user.userId,
        played,
        upcoming,
        currentSongId: current,
        providerResults: filteredProviderResults,
        providerErrors,
        providerNames,
        providerFetches,
        isProviderSearchActive,
        isProviderSearchDone,
        showOnlineSection,
        showProviderSearchButton,
        providerSearchBtnIdx,
        providerHeadingIdx,
        onSongQueue,
        onSongInfo,
        onSongStar,
        onFetch,
        onProviderSearch,
        onProviderSearchCancel,
      }}
      rowHeight={rowHeight}
      numRows={numRows}
      defaultScrollOffset={scrollOffset}
      onScroll={handleScroll}
      paddingTop={ui.headerHeight}
      paddingRight={4}
      paddingBottom={ui.footerHeight}
      height={ui.innerHeight}
      onRef={handleRef}
    />
  )
}

export default SearchResults
