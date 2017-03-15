import React, { PropTypes } from 'react'
import AppLayout from 'layouts/AppLayout'
import LibraryHeader from './LibraryHeader'
import ArtistList from './ArtistList'
import SearchResults from './SearchResults'

const LibraryView = (props) => {
  const View = props.searchTerm ? SearchResults : ArtistList
  const header = <LibraryHeader/>

  return (
    <AppLayout title="Library" header={header}>
      {(style) => (
        <View {...style} {...props}/>
      )}
    </AppLayout>
  )
}

LibraryView.propTypes = {
  artists: PropTypes.object.isRequired,
  songs: PropTypes.object.isRequired,
  queuedSongs: PropTypes.array.isRequired,
  starredSongs: PropTypes.array.isRequired,
  expandedArtists: PropTypes.array.isRequired,
  // search
  searchTerm: PropTypes.string.isRequired,
  artistResults: PropTypes.array.isRequired,
  expandedArtistResults: PropTypes.array.isRequired,
  songResults: PropTypes.array.isRequired,
  // actions
  queueSong: PropTypes.func.isRequired,
  toggleSongStarred: PropTypes.func.isRequired,
  toggleArtistExpanded: PropTypes.func.isRequired,
}

export default LibraryView
