import React, { PropTypes } from 'react'
import AppLayout from 'layouts/AppLayout'
import ArtistList from '../ArtistList'

const LibraryView = (props) => {
  return (
    <AppLayout title="Library">
      {(style) => (
        <ArtistList {...props} {...style}/>
      )}
    </AppLayout>
  )
}

LibraryView.propTypes = {
  artists: PropTypes.object.isRequired,
  songs: PropTypes.object.isRequired,
  queuedSongs: PropTypes.array.isRequired,
  expandedArtists: PropTypes.array.isRequired,
  scrollTop: PropTypes.number.isRequired,
  browserWidth: PropTypes.number.isRequired,
  browserHeight: PropTypes.number.isRequired,
  // actions
  queueSong: PropTypes.func.isRequired,
  scrollArtists: PropTypes.func.isRequired,
}

export default LibraryView
