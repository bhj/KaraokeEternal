import PropTypes from 'prop-types'
import React from 'react'
import PaddedList from 'components/PaddedList'
import ArtistItem from '../ArtistItem'
const ROW_HEIGHT = 44

class ArtistList extends React.Component {
  static propTypes = {
    artists: PropTypes.object.isRequired,
    media: PropTypes.object.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    paddingTop: PropTypes.number.isRequired,
    paddingBottom: PropTypes.number.isRequired,
    queuedMediaIds: PropTypes.array.isRequired,
    starredSongs: PropTypes.array.isRequired,
    expandedArtists: PropTypes.array.isRequired,
    scrollTop: PropTypes.number.isRequired,
    // actions
    queueSong: PropTypes.func.isRequired,
    toggleSongStarred: PropTypes.func.isRequired,
    toggleArtistExpanded: PropTypes.func.isRequired,
    scrollArtists: PropTypes.func.isRequired,
  }

  render () {
    if (this.props.artists.result.length === 0) return null

    return (
      <PaddedList
        width={this.props.width}
        height={this.props.height}
        scrollTop={this.props.scrollTop}
        paddingTop={this.props.paddingTop}
        paddingBottom={this.props.paddingBottom}
        rowCount={this.props.artists.result.length}
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
    this.props.scrollArtists(this.lastScrollPos)
  }

  rowRenderer = ({ index, key, style }) => {
    const { artists, expandedArtists } = this.props
    const artist = artists.entities[artists.result[index]]

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
    const artistId = this.props.artists.result[index]
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
    this.lastScrollPos = scrollTop
  }

  setRef = (ref) => {
    this.ref = ref
  }
}

export default ArtistList
