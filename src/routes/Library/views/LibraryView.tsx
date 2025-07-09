import React from 'react'
import { Link } from 'react-router-dom'
import ArtistList from '../components/ArtistList/ArtistList'
import SearchResults from '../components/SearchResults/SearchResults'
import TextOverlay from 'components/TextOverlay/TextOverlay'
import Spinner from 'components/Spinner/Spinner'
import styles from './LibraryView.css'
import { Artist, Song } from 'shared/types'
import { State as UIState } from 'store/modules/ui'

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
  scrollTop: number
  ui: UIState
  // SearchResults view
  songsResult: number[]
  artistsResult: number[]
  filterKeywords: string[]
  filterStarred: boolean
  expandedArtistResults: number[]
  // Actions
  toggleArtistExpanded: () => void
  toggleArtistResultExpanded: () => void
  scrollArtists: () => void
  showSongInfo: (songId: number) => void
  closeSongInfo: () => void
}

const LibraryView = (props: LibraryViewProps) => {
  const { isAdmin, isEmpty, isLoading, isSearching } = props

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
