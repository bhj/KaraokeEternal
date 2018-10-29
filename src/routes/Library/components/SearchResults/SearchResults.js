import PropTypes from 'prop-types'
import React from 'react'
import PaddedList from 'components/PaddedList'
import ArtistItem from '../ArtistItem'
import SongList from '../SongList'
import './SearchResults.css'

const ARTIST_HEADER_HEIGHT = 22
const ARTIST_RESULT_HEIGHT = 44
const SONG_HEADER_HEIGHT = 22
const SONG_RESULT_HEIGHT = 60

class SearchResults extends React.Component {
  static propTypes = {
    artists: PropTypes.object.isRequired,
    artistsResult: PropTypes.array.isRequired,
    songs: PropTypes.object.isRequired,
    songsResult: PropTypes.array.isRequired,
    starredSongs: PropTypes.array.isRequired,
    starredArtistCounts: PropTypes.object.isRequired,
    expandedArtistResults: PropTypes.array.isRequired,
    filterKeywords: PropTypes.array.isRequired,
    filterStarred: PropTypes.bool.isRequired,
    queuedSongIds: PropTypes.array.isRequired,
    ui: PropTypes.object.isRequired,
    // actions
    toggleArtistResultExpanded: PropTypes.func.isRequired,
  }

  componentDidUpdate (prevProps) {
    if (!this.list) return
    this.list.recomputeRowHeights()
  }

  render () {
    return (
      <PaddedList
        rowCount={this.props.artistsResult.length + 3} // both headers + SongList
        rowHeight={this.rowHeight}
        rowRenderer={this.rowRenderer}
        paddingTop={this.props.ui.headerHeight}
        paddingRight={10}
        paddingBottom={this.props.ui.footerHeight}
        width={this.props.ui.browserWidth}
        height={this.props.ui.browserHeight}
        onRef={this.setRef}
      />
    )
  }

  rowRenderer = ({ index, key, style }) => {
    const { artistsResult, songsResult, filterStarred } = this.props

    // # artist results heading
    if (index === 0) {
      return (
        <div key={key} style={style} styleName='artistsHeading'>
          {artistsResult.length} {filterStarred ? 'starred ' : ''}
          {artistsResult.length === 1 ? 'artist' : 'artists'}
        </div>
      )
    }

    // artist results
    if (index > 0 && index < artistsResult.length + 1) {
      const artistId = artistsResult[index - 1]
      const artist = this.props.artists[artistId]

      return (
        <ArtistItem
          songs={this.props.songs}
          name={artist.name}
          numStars={this.props.starredArtistCounts[artistId] || 0}
          artistSongIds={artist.songIds} // "children"
          queuedSongIds={this.props.queuedSongIds}
          starredSongs={this.props.starredSongs}
          isExpanded={this.props.expandedArtistResults.includes(artistId)}
          filterKeywords={this.props.filterKeywords}
          onArtistClick={() => this.props.toggleArtistResultExpanded(artistId)}
          key={key}
          style={style}
        />
      )
    }

    // # song results heading
    if (index === artistsResult.length + 1) {
      return (
        <div key={key} style={style} styleName='songsHeading'>
          {songsResult.length} {filterStarred ? 'starred ' : ''}
          {songsResult.length === 1 ? 'song' : 'songs'}
        </div>
      )
    }

    // song results
    return (
      <div style={style} key={key}>
        <SongList
          songIds={songsResult}
          showArtist
          filterKeywords={this.props.filterKeywords}
          queuedSongIds={this.props.queuedSongIds}
        />
      </div>
    )
  }

  rowHeight = ({ index }) => {
    // artists heading
    if (index === 0) return ARTIST_HEADER_HEIGHT

    // artist results
    if (index > 0 && index < this.props.artistsResult.length + 1) {
      let rows = 1
      const artistId = this.props.artistsResult[index - 1]

      if (this.props.expandedArtistResults.includes(artistId)) {
        rows += this.props.artists[artistId].songIds.length
      }

      return rows * ARTIST_RESULT_HEIGHT
    }

    // songs heading
    if (index === this.props.artistsResult.length + 1) return SONG_HEADER_HEIGHT

    // song results
    return this.props.songsResult.length * SONG_RESULT_HEIGHT
  }

  setRef = (ref) => {
    this.list = ref
  }
}

export default SearchResults
