import PropTypes from 'prop-types'
import React from 'react'
import LibraryHeader from '../components/LibraryHeader'
import ArtistList from '../components/ArtistList'
import SearchResults from '../components/SearchResults'
import SongInfo from '../components/SongInfo'

const LibraryView = (props) => {
  const View = props.isFiltering ? SearchResults : ArtistList

  return (
    <div>
      <LibraryHeader />

      <View {...props} />

      {props.isShowingSongInfo &&
        <SongInfo />
      }
    </div>
  )
}

LibraryView.propTypes = {
  isFiltering: PropTypes.bool.isRequired,
  isShowingSongInfo: PropTypes.bool.isRequired,
  viewportStyle: PropTypes.object.isRequired,
}

export default LibraryView
