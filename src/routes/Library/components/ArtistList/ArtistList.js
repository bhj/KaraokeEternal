import React, { PropTypes } from 'react'
import PaddedList from 'components/PaddedList'
import ArtistItem from '../ArtistItem'
const ROW_HEIGHT = 40

class ArtistList extends React.Component {
  static propTypes = {
    artists: PropTypes.object.isRequired,
    songs: PropTypes.object.isRequired,
    queuedSongIds: PropTypes.array.isRequired,
    expandedArtists: PropTypes.array.isRequired,
    scrollTop: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    paddingTop: PropTypes.number.isRequired,
    paddingBottom: PropTypes.number.isRequired,
    // actions
    queueSong: PropTypes.func.isRequired,
    scrollArtists: PropTypes.func.isRequired,
    toggleArtistExpanded: PropTypes.func.isRequired,
  }

  rowRenderer = this.rowRenderer.bind(this)
  rowHeight = this.rowHeight.bind(this)
  handleArtistClick = this.handleArtistClick.bind(this)
  handleSongClick = this.handleSongClick.bind(this)
  handleScroll = this.handleScroll.bind(this)
  setRef = this.setRef.bind(this)

  render () {
    if (this.props.artists.result.length === 0) return null

    return (
      <PaddedList
        width={this.props.width}
        height={this.props.height}
        scrollTop={this.props.scrollTop}
        paddingTop={this.props.paddingTop}
        paddingBottom={this.props.paddingBottom}
        songs={this.props.songs.result} // pass-through forces List refresh
        queuedSongIds={this.props.queuedSongIds} // pass-through forces List refresh
        rowCount={this.props.artists.result.length}
        rowHeight={this.rowHeight}
        rowRenderer={this.rowRenderer}
        onScroll={this.handleScroll}
        onRef={this.setRef}
      />
    )
  }

  rowRenderer({index, key, style}) {
    const { artists, songs, expandedArtists } = this.props
    const artist = artists.entities[artists.result[index]]

    return (
      <ArtistItem
        songs={songs}
        songIds={artist.songIds} // "children"
        queuedSongIds={this.props.queuedSongIds}
        name={artist.name}
        isExpanded={expandedArtists.indexOf(artist.artistId) !== -1}
        onArtistClick={() => this.handleArtistClick(artist.artistId)}
        onSongClick={this.handleSongClick}
        key={key}
        style={style}
      />
    )
  }

  rowHeight({index}) {
    const artistId = this.props.artists.result[index]
    let rows = 1

    if (this.props.expandedArtists.indexOf(artistId) !== -1) {
      rows += this.props.artists.entities[artistId].songIds.length
    }

    return rows * ROW_HEIGHT
  }

  handleArtistClick(artistId) {
    this.props.toggleArtistExpanded(artistId)

    this.ref.recomputeRowHeights()
    this.ref.forceUpdate()
  }

  handleSongClick(songId) {
    this.props.queueSong(songId)
  }

  handleScroll({ scrollTop }) {
    this.props.scrollArtists(scrollTop)
  }

  setRef(ref) {
    this.ref = ref
  }
}

export default ArtistList
