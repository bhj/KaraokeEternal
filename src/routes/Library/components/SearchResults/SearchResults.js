import PropTypes from 'prop-types'
import React from 'react'
import PaddedList from 'components/PaddedList'
import ArtistItem from '../ArtistItem'
import SongList from '../SongList'
import styles from './SearchResults.css'

const ARTIST_HEADER_HEIGHT = 22
const ARTIST_RESULT_HEIGHT = 44
const SONG_HEADER_HEIGHT = 22
const SONG_RESULT_HEIGHT = 60

class SearchResults extends React.Component {
  static propTypes = {
    artists: PropTypes.object.isRequired,
    artistsResult: PropTypes.array.isRequired,
    expandedArtistResults: PropTypes.array.isRequired,
    filterKeywords: PropTypes.array.isRequired,
    filterStarred: PropTypes.bool.isRequired,
    queuedSongs: PropTypes.array.isRequired,
    songs: PropTypes.object.isRequired,
    songsResult: PropTypes.array.isRequired,
    starredSongs: PropTypes.array.isRequired,
    starredArtistCounts: PropTypes.object.isRequired,
    ui: PropTypes.object.isRequired,
    // actions
    toggleArtistResultExpanded: PropTypes.func.isRequired,
  }

  componentDidUpdate (prevProps) {
    if (this.list) {
      // @todo: clear size cache starting from the toggled artist
      this.list.resetAfterIndex(0)
    }
  }

  render () {
    return (
      <PaddedList
        numRows={this.props.artistsResult.length + 3} // both headers + SongList
        rowHeight={this.rowHeight}
        rowRenderer={this.rowRenderer}
        paddingTop={this.props.ui.headerHeight}
        paddingRight={4}
        paddingBottom={this.props.ui.footerHeight}
        width={this.props.ui.innerWidth}
        height={this.props.ui.innerHeight}
        onRef={this.setRef}
      />
    )
  }

  rowRenderer = ({ index, style }) => {
    const { artistsResult, songsResult, filterStarred } = this.props

    // # artist results heading
    if (index === 0) {
      return (
        <div key={'artistsHeading'} style={style} className={styles.artistsHeading}>
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
          artistId={artistId}
          songs={this.props.songs}
          name={artist.name}
          numStars={this.props.starredArtistCounts[artistId] || 0}
          artistSongIds={artist.songIds} // "children"
          queuedSongs={this.props.queuedSongs}
          starredSongs={this.props.starredSongs}
          isExpanded={this.props.expandedArtistResults.includes(artistId)}
          filterKeywords={this.props.filterKeywords}
          onArtistClick={this.props.toggleArtistResultExpanded}
          key={artistId}
          style={style}
        />
      )
    }

    // # song results heading
    if (index === artistsResult.length + 1) {
      return (
        <div key={'songsHeading'} style={style} className={styles.songsHeading}>
          {songsResult.length} {filterStarred ? 'starred ' : ''}
          {songsResult.length === 1 ? 'song' : 'songs'}
        </div>
      )
    }

    // song results
    return (
      <div style={style} key={'songs'}>
        <SongList
          songIds={songsResult}
          showArtist
          filterKeywords={this.props.filterKeywords}
          queuedSongs={this.props.queuedSongs}
        />
      </div>
    )
  }

  rowHeight = index => {
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
