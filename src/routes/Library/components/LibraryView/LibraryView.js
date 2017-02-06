import React, { PropTypes } from 'react'
import AppLayout from 'layouts/AppLayout'
import ArtistList from '../ArtistList'
import LibraryHeader from '../LibraryHeader'
import SearchResults from '../SearchResults'

const LibraryView = (props) => {
  const View = props.isSearching ? SearchResults : ArtistList
  return (
    <AppLayout title="Library" header={LibraryHeader}>
      {(style) => (
        <View {...style} {...props}/>
      )}
    </AppLayout>
  )
}

LibraryView.propTypes = {
  artists: PropTypes.object.isRequired,
  songs: PropTypes.object.isRequired,
  queuedSongIds: PropTypes.array.isRequired,
  expandedArtists: PropTypes.array.isRequired,
  expandedArtistResults: PropTypes.array.isRequired,
  scrollTop: PropTypes.number.isRequired,
  isSearching: PropTypes.bool.isRequired,
  artistResults: PropTypes.array.isRequired,
  songResults: PropTypes.array.isRequired,
  // actions
  queueSong: PropTypes.func.isRequired,
  scrollArtists: PropTypes.func.isRequired,
}

export default LibraryView
