import React, { PropTypes } from 'react'
import AppLayout from 'layouts/AppLayout'
import LibraryHeader from '../LibraryHeader'
import ArtistList from '../ArtistList'
import SearchResults from '../SearchResults'

const LibraryView = (props) => {
  const View = props.searchTerm ? SearchResults : ArtistList
  return (
    <AppLayout title="Library" header={LibraryHeader}>
      {(style) => (
        <View {...style}/>
      )}
    </AppLayout>
  )
}

LibraryView.propTypes = {
  searchTerm: PropTypes.string.isRequired,
}

export default LibraryView
