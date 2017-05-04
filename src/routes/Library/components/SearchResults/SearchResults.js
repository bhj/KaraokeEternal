import PropTypes from 'prop-types'
import React from 'react'
import PaddedList from 'components/PaddedList'
import ArtistItem from '../ArtistItem'
import SongItem from '../SongItem'
import './SearchResults.css'
const ROW_HEIGHT = 40

class SearchResults extends React.Component {
  static propTypes = {
    artists: PropTypes.object.isRequired,
    songs: PropTypes.object.isRequired,
    artistResults: PropTypes.array.isRequired,  // artistIds
    songResults: PropTypes.array.isRequired,  // songIds
    starredSongs: PropTypes.array.isRequired,
    expandedArtistResults: PropTypes.array.isRequired,
    queuedSongs: PropTypes.array.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    paddingTop: PropTypes.number.isRequired,
    paddingBottom: PropTypes.number.isRequired,
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
        width={this.props.width}
        height={this.props.height}
        paddingTop={this.props.paddingTop}
        paddingBottom={this.props.paddingBottom}
        rowCount={this.props.artistResults.length + this.props.songResults.length + 2}
        rowHeight={this.rowHeight}
        rowRenderer={this.rowRenderer}
        onRef={this.setRef}
      />
    )
  }

  rowRenderer = ({ index, key, style }) => {
    const { artistResults, songResults } = this.props

    // # artist results heading
    if (index === 0) {
      return (
        <div key={key} style={style} styleName='artistsHeading'>
          {artistResults.length} artists
        </div>
      )
    }

    // artist results
    if (index > 0 && index < artistResults.length + 1) {
      const artistId = artistResults[index - 1]
      const artist = this.props.artists.entities[artistId]

      return (
        <ArtistItem
          songs={this.props.songs}
          songIds={artist.songIds} // "children"
          queuedSongs={this.props.queuedSongs}
          starredSongs={this.props.starredSongs}
          name={artist.name}
          isExpanded={this.props.expandedArtistResults.includes(artistId)}
          onArtistClick={() => this.handleArtistClick(artistId)}
          onSongClick={this.props.queueSong}
          onSongStarClick={this.props.toggleSongStarred}
          key={key}
          style={style}
        />
      )
    }

    // # song results heading
    if (index === artistResults.length + 1) {
      return (
        <div key={key} style={style} styleName='songsHeading'>
          {songResults.length} songs
        </div>
      )
    }

    // song results; compensate for artists & heading
    const songId = songResults[index - (artistResults.length + 2)]
    const song = this.props.songs.entities[songId]

    return (
      <SongItem
        {...song}
        key={key}
        style={style}
        onSongClick={() => this.handleSongClick(songId)}
        onSongStarClick={() => this.handleSongStarClick(songId)}
        isQueued={this.props.queuedSongs.includes(songId)}
        isStarred={this.props.starredSongs.includes(songId)}
      />
    )
  }

  rowHeight = ({ index }) => {
    // header
    if (index === 0) return ROW_HEIGHT

    const artistId = this.props.artistResults[index - 1]
    let rows = 1

    if (this.props.expandedArtistResults.includes(artistId)) {
      rows += this.props.artists.entities[artistId].songIds.length
    }

    return rows * ROW_HEIGHT
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
