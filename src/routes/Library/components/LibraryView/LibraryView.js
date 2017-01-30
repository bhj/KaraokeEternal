import React, { PropTypes } from 'react'
import AppLayout from 'layouts/AppLayout'
import ArtistList from '../ArtistList'
import LibraryHeader from './LibraryHeader'

const LibraryView = (props) => {
  return (
    <AppLayout title="Library" header={LibraryHeader}>
      {(ui) => (
        <ArtistList {...props}
          width={ui.browserWidth}
          height={ui.browserHeight}
          paddingTop={ui.headerHeight}
          paddingBottom={ui.footerHeight}
        />
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
  // actions
  queueSong: PropTypes.func.isRequired,
  scrollArtists: PropTypes.func.isRequired,
}

export default LibraryView
