import PropTypes from 'prop-types'
import React from 'react'
import LibraryHeader from '../components/LibraryHeader'
import ArtistList from '../components/ArtistList'
import SearchResults from '../components/SearchResults'
import SongInfo from '../components/SongInfo'

const LibraryView = (props) => {
  const View = props.filterKeywords.length || props.filterStarred ? SearchResults : ArtistList

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
  filterKeywords: PropTypes.array.isRequired,
  filterStarred: PropTypes.bool.isRequired,
  isShowingSongInfo: PropTypes.bool.isRequired,
  ui: PropTypes.object.isRequired,
}

export default LibraryView
