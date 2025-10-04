import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router'
import ArtistList from '../components/ArtistList/ArtistList'
import SearchResults from '../components/SearchResults/SearchResults'
import TextOverlay from 'components/TextOverlay/TextOverlay'
import Spinner from 'components/Spinner/Spinner'
import styles from './LibraryView.css'
import { Artist, Song } from 'shared/types'
import { type UIState } from 'store/modules/ui'

interface LibraryViewProps {
  isAdmin: boolean
  isLoading: boolean
  isSearching: boolean
  isEmpty: boolean
  artists: Record<number, Artist>
  songs: Record<number, Song>
  starredArtistCounts: Record<number, number>
  queuedSongs: number[]
  starredSongs: number[]
  expandedArtists: number[]
  alphaPickerMap: Record<string, number>
  scrollRow: number
  ui: UIState
  // SearchResults view
  songsResult: number[]
  artistsResult: number[]
  filterKeywords: string[]
  filterStarred: boolean
  expandedArtistResults: number[]
  // Actions
  toggleArtistExpanded: (artistId: number) => void
  toggleArtistResultExpanded: (artistId: number) => void
  scrollArtists: (scrollRow: number) => void
  showSongInfo: (songId: number) => void
  closeSongInfo: () => void
}

const LibraryView = (props: LibraryViewProps) => {
  const { isAdmin, isEmpty, isLoading, isSearching, ui } = props
  const initialHeaderHeight = useRef(ui.headerHeight)
  const [finalHeaderHeight, setFinalHeaderHeight] = useState(null)

  // don't render ArtistList until headerHeight is stable; otherwise
  // scroll position restoration does not work well (appears OBO)
  // @todo - this is hacky
  useEffect(() => {
    if (ui.headerHeight > initialHeaderHeight.current) {
      setFinalHeaderHeight(ui.headerHeight)
    }
  }, [ui.headerHeight, finalHeaderHeight])

  if (!finalHeaderHeight) return null

  return (
    <>
      {!isSearching && <ArtistList {...props} />}

      {isSearching && <SearchResults {...props} />}

      {isLoading && <Spinner />}

      {!isLoading && isEmpty && (
        <TextOverlay className={styles.empty}>
          <h1>Library Empty</h1>
          {isAdmin && (
            <p>
              <Link to='/account'>Add media folders</Link>
              {' '}
              to get started.
            </p>
          )}
        </TextOverlay>
      )}
    </>
  )
}

export default LibraryView
