import PropTypes from 'prop-types'
import React from 'react'
import PaddedList from 'components/PaddedList'
import ArtistItem from '../ArtistItem'
import SongItem from '../SongItem'
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
    expandedArtistResults: PropTypes.array.isRequired,
    filterKeywords: PropTypes.array.isRequired,
    queuedSongIds: PropTypes.array.isRequired,
    viewportStyle: PropTypes.object.isRequired,
    // actions
    queueSong: PropTypes.func.isRequired,
    toggleSongStarred: PropTypes.func.isRequired,
    toggleArtistResultExpanded: PropTypes.func.isRequired,
  }

  componentDidUpdate (prevProps) {
    if (!this.ref) return
    // nuclear option
    this.ref.recomputeRowHeights()
    this.ref.forceUpdate()
  }

  render () {
    return (
      <PaddedList
        viewportStyle={this.props.viewportStyle}
        rowCount={this.props.artistsResult.length + this.props.songsResult.length + 2}
        rowHeight={this.rowHeight}
        rowRenderer={this.rowRenderer}
        onRef={this.setRef}
      />
    )
  }

  rowRenderer = ({ index, key, style }) => {
    const { artistsResult, songsResult } = this.props

    // # artist results heading
    if (index === 0) {
      return (
        <div key={key} style={style} styleName='artistsHeading'>
          {artistsResult.length} artists
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
          artistSongIds={artist.songIds} // "children"
          queuedSongIds={this.props.queuedSongIds}
          starredSongs={this.props.starredSongs}
          isExpanded={this.props.expandedArtistResults.includes(artistId)}
          filterKeywords={this.props.filterKeywords}
          onArtistClick={() => this.handleArtistClick(artistId)}
          onSongClick={this.props.queueSong}
          onSongStarClick={this.props.toggleSongStarred}
          key={key}
          style={style}
        />
      )
    }

    // # song results heading
    if (index === artistsResult.length + 1) {
      return (
        <div key={key} style={style} styleName='songsHeading'>
          {songsResult.length} songs
        </div>
      )
    }

    // song results; compensate for artists & heading
    const songId = songsResult[index - (artistsResult.length + 2)]
    const song = this.props.songs[songId]

    return (
      <SongItem {...song}
        onSongClick={() => this.handleSongClick(songId)}
        onSongStarClick={() => this.handleSongStarClick(songId)}
        isQueued={this.props.queuedSongIds.includes(songId)}
        isStarred={this.props.starredSongs.includes(songId)}
        artist={this.props.artists[song.artistId].name}
        filterKeywords={this.props.filterKeywords}
        showArtist
        key={key}
        style={style}
      />
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
    return SONG_RESULT_HEIGHT
  }

  handleArtistClick = (artistId) => {
    this.props.toggleArtistResultExpanded(artistId)
  }

  handleSongClick = (songId) => {
    this.props.queueSong(songId)
  }

  handleSongStarClick = (songId) => {
    this.props.toggleSongStarred(songId)
  }

  setRef = (ref) => {
    this.ref = ref
  }
}

export default SearchResults
