import PropTypes from 'prop-types'
import React from 'react'
import LibraryHeader from '../components/LibraryHeader'
import ArtistList from '../components/ArtistList'
import SearchResults from '../components/SearchResults'

const LibraryView = (props) => {
  const View = props.isFiltering ? SearchResults : ArtistList

  return (
    <div>
      <LibraryHeader />

      <View {...props} />
    </div>
  )
}

LibraryView.propTypes = {
  isFiltering: PropTypes.string.isRequired,
  viewportStyle: PropTypes.object.isRequired,
}

export default LibraryView
