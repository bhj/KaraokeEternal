import PropTypes from 'prop-types'
import React from 'react'
import AppLayout from 'layouts/AppLayout'
import LibraryHeader from './LibraryHeader'
import ArtistList from './ArtistList'
import SearchResults from './SearchResults'

const LibraryView = (props) => {
  const View = props.searchTerm ? SearchResults : ArtistList

  return (
    <AppLayout>
      {viewportStyle => (
        <div>
          <LibraryHeader />

          <View
            {...props}
            {...viewportStyle}
            />
        </div>
      )}
    </AppLayout>
  )
}

LibraryView.propTypes = {
  searchTerm: PropTypes.string.isRequired,
}

export default LibraryView
