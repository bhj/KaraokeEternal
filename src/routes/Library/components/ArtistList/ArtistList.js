import PropTypes from 'prop-types'
import React from 'react'
import PaddedList from 'components/PaddedList'
import AlphaPicker from '../AlphaPicker'
import ArtistItem from '../ArtistItem'
const ROW_HEIGHT = 44

class ArtistList extends React.Component {
  static propTypes = {
    alphaPickerMap: PropTypes.object.isRequired,
    artists: PropTypes.object.isRequired, // entities
    artistsResult: PropTypes.array.isRequired, // artistIds
    expandedArtists: PropTypes.array.isRequired,
    filterKeywords: PropTypes.array.isRequired,
    queuedSongs: PropTypes.array.isRequired,
    songs: PropTypes.object.isRequired, // entities
    starredSongs: PropTypes.array.isRequired,
    starredArtistCounts: PropTypes.object.isRequired,
    scrollTop: PropTypes.number.isRequired,
    // actions
    toggleArtistExpanded: PropTypes.func.isRequired,
    scrollArtists: PropTypes.func.isRequired,
    // ui
    browserWidth: PropTypes.number.isRequired,
    browserHeight: PropTypes.number.isRequired,
    headerHeight: PropTypes.number.isRequired,
    footerHeight: PropTypes.number.isRequired,
  }

  render () {
    if (this.props.artistsResult.length === 0) return null
    const { browserWidth, browserHeight, headerHeight, footerHeight } = this.props

    return (
      <div>
        <PaddedList
          rowCount={this.props.artistsResult.length}
          rowHeight={this.rowHeight}
          rowRenderer={this.rowRenderer}
          onScroll={this.handleScroll}
          onRef={this.handleRef}
          paddingTop={headerHeight}
          paddingRight={30} // width of AlphaPicker
          paddingBottom={footerHeight}
          width={browserWidth}
          height={browserHeight}
          scrollToAlignment='start'
        />
        <AlphaPicker
          onPick={this.handleAlphaPick}
          onTouch={this.handleAlphaTouch}
          height={browserHeight - headerHeight - footerHeight}
          top={headerHeight}
        />
      </div>
    )
  }

  componentWillUnmount () {
    this.props.scrollArtists(this.lastScrollTop || this.props.scrollTop)
  }

  componentDidUpdate (prevProps) {
    if (!this.list) return
    this.list.recomputeRowHeights()
  }

  rowRenderer = ({ index, key, style }) => {
    const { artists, artistsResult, expandedArtists } = this.props
    const artist = artists[artistsResult[index]]

    return (
      <ArtistItem
        artistId={artist.artistId}
        artistSongIds={artist.songIds} // "children"
        filterKeywords={this.props.filterKeywords}
        isExpanded={expandedArtists.includes(artist.artistId)}
        key={key}
        name={artist.name}
        numStars={this.props.starredArtistCounts[artist.artistId] || 0}
        onArtistClick={this.props.toggleArtistExpanded}
        queuedSongs={this.props.queuedSongs}
        starredSongs={this.props.starredSongs}
        songs={this.props.songs}
        style={style}
      />
    )
  }

  rowHeight = ({ index }) => {
    const artistId = this.props.artistsResult[index]
    let rows = 1

    if (this.props.expandedArtists.includes(artistId)) {
      rows += this.props.artists[artistId].songIds.length
    }

    return rows * ROW_HEIGHT
  }

  handleScroll = ({ scrollTop }) => {
    this.lastScrollTop = scrollTop
  }

  handleAlphaPick = (char) => {
    const row = this.props.alphaPickerMap[char]

    if (typeof row !== 'undefined') {
      this.list.scrollToRow(row > 0 ? row - 1 : row)
    }
  }

  handleRef = r => {
    this.list = r
    this.list.scrollToPosition(this.props.scrollTop)
  }
}

export default ArtistList
