import PropTypes from 'prop-types'
import React from 'react'
import PaddedList from 'components/PaddedList'
import ArtistItem from '../ArtistItem'
const ROW_HEIGHT = 44

class ArtistList extends React.Component {
  static propTypes = {
    artists: PropTypes.object.isRequired,
    artistsResult: PropTypes.array.isRequired,
    media: PropTypes.object.isRequired,
    mediaResult: PropTypes.array.isRequired,
    queuedMediaIds: PropTypes.array.isRequired,
    starredSongs: PropTypes.array.isRequired,
    expandedArtists: PropTypes.array.isRequired,
    scrollTop: PropTypes.number.isRequired,
    viewportStyle: PropTypes.object.isRequired,
    // actions
    queueSong: PropTypes.func.isRequired,
    toggleSongStarred: PropTypes.func.isRequired,
    toggleArtistExpanded: PropTypes.func.isRequired,
    scrollArtists: PropTypes.func.isRequired,
  }

  render () {
    if (this.props.artistsResult.length === 0) return null

    return (
      <PaddedList
        viewportStyle={this.props.viewportStyle}
        scrollTop={this.props.scrollTop}
        rowCount={this.props.artistsResult.length}
        rowHeight={this.rowHeight}
        rowRenderer={this.rowRenderer}
        onScroll={this.handleScroll}
        onRef={this.setRef}
      />
    )
  }

  componentDidUpdate (prevProps) {
    if (!this.ref) return
    this.ref.recomputeRowHeights()
    this.ref.forceUpdate()
  }

  componentWillUnmount () {
    this.props.scrollArtists(this.lastScrollTop || this.props.scrollTop)
  }

  rowRenderer = ({ index, key, style }) => {
    const { artists, artistsResult, expandedArtists } = this.props
    const artist = artists.entities[artistsResult[index]]

    return (
      <ArtistItem
        media={this.props.media}
        artistMediaIds={artist.mediaIds} // "children"
        queuedMediaIds={this.props.queuedMediaIds}
        starredSongs={this.props.starredSongs}
        name={artist.name}
        isExpanded={expandedArtists.includes(artist.artistId)}
        onArtistClick={() => this.handleArtistClick(artist.artistId)}
        onSongStarClick={this.props.toggleSongStarred}
        onSongClick={this.props.queueSong}
        key={key}
        style={style}
      />
    )
  }

  rowHeight = ({ index }) => {
    const artistId = this.props.artistsResult[index]
    let rows = 1

    if (this.props.expandedArtists.includes(artistId)) {
      rows += this.props.artists.entities[artistId].mediaIds.length
    }

    return rows * ROW_HEIGHT
  }

  handleArtistClick = (artistId) => {
    this.props.toggleArtistExpanded(artistId)
  }

  handleScroll = ({ scrollTop }) => {
    this.lastScrollTop = scrollTop
  }

  setRef = (ref) => {
    this.ref = ref
  }
}

export default ArtistList
