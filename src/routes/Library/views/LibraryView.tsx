import React, { useEffect, useRef, useState } from 'react'
import { useAppSelector } from 'store/hooks'
import { Link } from 'react-router'
import ArtistList from '../components/ArtistList/ArtistList'
import SearchResults from '../components/SearchResults/SearchResults'
import TextOverlay from 'components/TextOverlay/TextOverlay'
import Spinner from 'components/Spinner/Spinner'
import styles from './LibraryView.css'

const LibraryView = () => {
  const { isAdmin } = useAppSelector(state => state.user)
  const { isLoading, filterStr, filterStarred } = useAppSelector(state => state.library)
  const songsResult = useAppSelector(state => state.songs.result)
  const ui = useAppSelector(state => state.ui)

  const isSearching = !!filterStr.trim().length || filterStarred

  // ArtistList virtualizes rows against ui.headerHeight (the header includes
  // LibraryHeader on this route, measured async via ResizeObserver). Mounting
  // before the height settles makes saved scroll positions land off by
  // (delta / rowHeight) rows. Wait for the first growth past the value at
  // mount before rendering ArtistList.
  const initialHeaderHeight = useRef(ui.headerHeight)
  const [isReady, setIsReady] = useState(false)
  useEffect(() => {
    if (!isReady && ui.headerHeight > initialHeaderHeight.current) {
      setIsReady(true)
    }
  }, [ui.headerHeight, isReady])

  if (!isReady) return null

  return (
    <>
      {!isSearching && <ArtistList ui={ui} />}

      {isSearching && <SearchResults ui={ui} />}

      {isLoading && <Spinner />}

      {!isLoading && songsResult.length === 0 && (
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
