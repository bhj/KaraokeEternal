import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'
import PaddedList from 'components/PaddedList'
import ArtistItem from '../ArtistItem'
import SongList from '../SongList'
import styles from './SearchResults.css'
import YouTubeSearch from '../YouTubeSearch'

const YOUTUBE_SEARCH_BUTTON_HEIGHT = 90
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

    isYouTubeEnabled: PropTypes.bool,
  }

  state = {
    searchingYouTube: false,
  }

  componentDidUpdate (prevProps) {
    if (this.list && !this.state.searchingYouTube) {
      // @todo: clear size cache starting from the toggled artist
      this.list.resetAfterIndex(0)
    }

    // return to local results if we were searching YouTube and changed the query...
    if (this.state.searchingYouTube && prevProps.filterKeywords !== this.props.filterKeywords) {
      this.setState({ searchingYouTube:false })
    }
  }

  render () {
    if (this.state.searchingYouTube) {
      return (
        <YouTubeSearch
          onDone={this.cancelSearchYouTube}
          filterKeywords={this.props.filterKeywords}
          ui={this.props.ui}
        />
      )
    }

    return (
      <PaddedList
        numRows={this.props.artistsResult.length + 3 + (this.props.isYouTubeEnabled * 1)} // both headers + SongList + YouTube button
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
    const { artistsResult, songsResult, filterStarred, songs } = this.props
    const emptyLibrary = Object.keys(songs).length === 0

    // YouTube search button
    if (this.props.isYouTubeEnabled) {
      if (index === 0) {
        return (
          <div style={style} className={styles.youtubeButtonContainer}>
            <button
              id={emptyLibrary ? 'youtubeSearchButton' : ''}
              onClick={this.searchYouTube}
              className={`${styles.btn} primary ${styles.youtubeButton}`}
            >
              Search YouTube for <strong>{this.props.filterKeywords.join(' ')}</strong>
            </button>
          </div>
        )
      } else if (emptyLibrary) {
        return <div></div>
      }
    } else {
      index++
    }

    // # artist results heading
    if (index === 1) {
      return (
        <div key={'artistsHeading'} style={style} className={styles.artistsHeading}>
          {artistsResult.length} {filterStarred ? 'starred ' : ''}
          {artistsResult.length === 1 ? 'artist' : 'artists'}
        </div>
      )
    }

    // artist results
    if (index > 1 && index < artistsResult.length + 2) {
      const artistId = artistsResult[index - 2]
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
    if (index === artistsResult.length + 2) {
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
    // youtube search button
    if (this.props.isYouTubeEnabled) {
      if (index === 0) return YOUTUBE_SEARCH_BUTTON_HEIGHT
    } else {
      index++
    }

    // artists heading
    if (index === 1) return ARTIST_HEADER_HEIGHT

    // artist results
    if (index > 1 && index < this.props.artistsResult.length + 2) {
      let rows = 1
      const artistId = this.props.artistsResult[index - 2]

      if (this.props.expandedArtistResults.includes(artistId)) {
        rows += this.props.artists[artistId].songIds.length
      }

      return rows * ARTIST_RESULT_HEIGHT
    }

    // songs heading
    if (index === this.props.artistsResult.length + 2) return SONG_HEADER_HEIGHT

    // song results
    return this.props.songsResult.length * SONG_RESULT_HEIGHT
  }

  searchYouTube = () => {
    this.setState({ searchingYouTube: true })
  }

  cancelSearchYouTube = () => {
    this.setState({ searchingYouTube: false })
  }

  setRef = (ref) => {
    this.list = ref
  }
}

const mapStateToProps = state => {
  return {
    isYouTubeEnabled: state.prefs.isYouTubeEnabled
  }
}

export default connect(mapStateToProps)(SearchResults)
