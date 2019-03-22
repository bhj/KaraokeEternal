import PropTypes from 'prop-types'
import React from 'react'
import LibraryHeader from '../components/LibraryHeader'
import ArtistList from '../components/ArtistList'
import SearchResults from '../components/SearchResults'
import TextOverlay from 'components/TextOverlay'
import Spinner from 'components/Spinner'

const LibraryView = (props) => {
  const { isSearching, isLoading, isEmpty } = props

  return (
    <>
      <LibraryHeader />

      {!isSearching &&
        <ArtistList {...props} />
      }

      {isSearching &&
        <SearchResults {...props} />
      }

      {isLoading &&
        <Spinner />
      }

      {!isLoading && isEmpty &&
        <TextOverlay>
          <h1>Library Empty</h1>
        </TextOverlay>
      }
    </>
  )
}

LibraryView.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  isSearching: PropTypes.bool.isRequired,
  isEmpty: PropTypes.bool.isRequired,
}

export default LibraryView
