import PropTypes from 'prop-types'
import React from 'react'
import LibraryHeader from '../components/LibraryHeader'
import ArtistList from '../components/ArtistList'
import SearchResults from '../components/SearchResults'

const LibraryView = (props) => {
  const { viewportStyle, ...restProps } = props
  const View = props.searchTerm ? SearchResults : ArtistList

  return (
    <div>
      <LibraryHeader />

      <View {...viewportStyle} {...restProps} />
    </div>
  )
}

LibraryView.propTypes = {
  viewportStyle: PropTypes.object.isRequired,
  searchTerm: PropTypes.string.isRequired,
}

export default LibraryView
