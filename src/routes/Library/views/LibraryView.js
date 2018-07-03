import PropTypes from 'prop-types'
import React from 'react'
import LibraryHeader from '../components/LibraryHeader'
import ArtistList from '../components/ArtistList'
import SearchResults from '../components/SearchResults'
import SongInfo from '../components/SongInfo'
import TextOverlay from 'components/TextOverlay'

const LibraryView = (props) => {
  const { isSearching, isLibraryEmpty, isShowingSongInfo } = props

  return (
    <>
      <LibraryHeader />

      {!isSearching &&
        <ArtistList {...props} />
      }

      {isSearching &&
        <SearchResults {...props} />
      }

      {isLibraryEmpty &&
        <TextOverlay>
          <h1>Library Empty</h1>
        </TextOverlay>
      }

      {isShowingSongInfo &&
        <SongInfo />
      }
    </>
  )
}

LibraryView.propTypes = {
  isSearching: PropTypes.bool.isRequired,
  isLibraryEmpty: PropTypes.bool.isRequired,
  isShowingSongInfo: PropTypes.bool.isRequired,
}

export default LibraryView
