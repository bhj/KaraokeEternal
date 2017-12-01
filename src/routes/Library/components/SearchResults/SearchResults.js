import PropTypes from 'prop-types'
import React from 'react'
import PaddedList from 'components/PaddedList'
import ArtistItem from '../ArtistItem'
import SongItem from '../SongItem'
import './SearchResults.css'
const ROW_HEIGHT = 44

class SearchResults extends React.Component {
  static propTypes = {
    artists: PropTypes.object.isRequired,
    media: PropTypes.object.isRequired,
    artistResults: PropTypes.array.isRequired, // artistIds
    songResults: PropTypes.array.isRequired, // mediaIds
    starredSongs: PropTypes.array.isRequired,
    expandedArtistResults: PropTypes.array.isRequired,
    queuedMediaIds: PropTypes.array.isRequired,
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
          media={this.props.media}
          artistMediaIds={artist.mediaIds} // "children"
          queuedMediaIds={this.props.queuedMediaIds}
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
    const mediaId = songResults[index - (artistResults.length + 2)]
    const song = this.props.media.entities[mediaId]

    return (
      <SongItem {...song}
        onSongClick={() => this.handleSongClick(mediaId)}
        onSongStarClick={() => this.handleSongStarClick(mediaId)}
        isQueued={this.props.queuedMediaIds.includes(mediaId)}
        isStarred={this.props.starredSongs.includes(mediaId)}
        key={key}
        style={style}
      />
    )
  }

  rowHeight = ({ index }) => {
    // header
    if (index === 0) return ROW_HEIGHT

    const artistId = this.props.artistResults[index - 1]
    let rows = 1

    if (this.props.expandedArtistResults.includes(artistId)) {
      rows += this.props.artists.entities[artistId].mediaIds.length
    }

    return rows * ROW_HEIGHT
  }

  handleArtistClick = (artistId) => {
    this.props.toggleArtistResultExpanded(artistId)
  }

  handleSongClick = (mediaId) => {
    this.props.queueSong(mediaId)
  }

  handleSongStarClick = (mediaId) => {
    this.props.toggleSongStarred(mediaId)
  }

  setRef = (ref) => {
    this.ref = ref
  }
}

export default SearchResults
