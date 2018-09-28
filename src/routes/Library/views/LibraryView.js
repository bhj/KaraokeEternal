import PropTypes from 'prop-types'
import React from 'react'
import LibraryHeader from '../components/LibraryHeader'
import ArtistList from '../components/ArtistList'
import SearchResults from '../components/SearchResults'
import SongInfo from '../components/SongInfo'
import TextOverlay from 'components/TextOverlay'
import Spinner from 'components/Spinner'
import { SkyLightStateless } from 'react-skylight'

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

      {isEmpty &&
        <TextOverlay>
          <h1>Library Empty</h1>
        </TextOverlay>
      }

      <SkyLightStateless
        isVisible={props.isSongInfoOpen}
        onCloseClicked={props.closeSongInfo}
        onOverlayClicked={props.closeSongInfo}
        title={'Song Details'}
        dialogStyles={{
          width: '90%',
          height: '90%',
          top: '5%',
          left: '5%',
          margin: 0,
          overflow: 'auto',
        }}
      >
        <SongInfo />
      </SkyLightStateless>
    </>
  )
}

LibraryView.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  isSearching: PropTypes.bool.isRequired,
  isEmpty: PropTypes.bool.isRequired,
  isSongInfoOpen: PropTypes.bool.isRequired,
  // actions
  closeSongInfo: PropTypes.func.isRequired,
}

export default LibraryView
