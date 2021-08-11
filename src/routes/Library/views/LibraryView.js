import PropTypes from 'prop-types'
import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import LibraryHeader from '../components/LibraryHeader'
import ArtistList from '../components/ArtistList'
import SearchResults from '../components/SearchResults'
import TextOverlay from 'components/TextOverlay'
import Spinner from 'components/Spinner'
import styles from './LibraryView.css'

const LibraryView = (props) => {
  const { isAdmin, isEmpty, isLoading, isSearching } = props
  const isYouTubeEnabled = useSelector(state => state.prefs.isYouTubeEnabled)
  const isKaraokeGeneratorEnabled = useSelector(state => state.prefs.isKaraokeGeneratorEnabled)
  React.useLayoutEffect(() => props.setHeader(LibraryHeader))

  return (
    <>
      {!isSearching &&
        <ArtistList {...props} />
      }

      {isSearching &&
        <SearchResults {...props} />
      }

      {isLoading &&
        <Spinner />
      }

      {!isLoading && isEmpty && !isSearching && isYouTubeEnabled &&
        <TextOverlay className={styles.empty}>
          <h1>Search YouTube!</h1>
          <p>
            Enter a song and/or artist in the search bar above.
            {isKaraokeGeneratorEnabled && <> Our robots will convert music videos to karaoke mixes!</>}
            {!isKaraokeGeneratorEnabled && <> We'll find pre-made karaoke mixes for you!</>}
          </p>
        </TextOverlay>
      }

      {!isLoading && isEmpty && !isYouTubeEnabled &&
        <TextOverlay className={styles.empty}>
          <h1>Library Empty</h1>
          {isAdmin &&
            <p>
              <Link to='/account'>Add media folders</Link>
              <> or <Link to='/account'>enable YouTube search</Link></>
              <> to get started.</>
            </p>
          }
        </TextOverlay>
      }
    </>
  )
}

LibraryView.propTypes = {
  isAdmin: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  isSearching: PropTypes.bool.isRequired,
  isEmpty: PropTypes.bool.isRequired,
  setHeader: PropTypes.func.isRequired,
}

export default LibraryView
