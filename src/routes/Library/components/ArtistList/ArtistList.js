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
    ui: PropTypes.object.isRequired,
    // actions
    toggleArtistExpanded: PropTypes.func.isRequired,
    scrollArtists: PropTypes.func.isRequired,
  }

  render () {
    if (this.props.artistsResult.length === 0) return null

    return (
      <div>
        <PaddedList
          numRows={this.props.artistsResult.length}
          rowHeight={this.rowHeight}
          rowRenderer={this.rowRenderer}
          onScroll={this.handleScroll}
          onRef={this.handleRef}
          paddingTop={this.props.ui.headerHeight}
          paddingRight={30} // width of AlphaPicker
          paddingBottom={this.props.ui.footerHeight}
          width={this.props.ui.innerWidth}
          height={this.props.ui.innerHeight}
        />
        <AlphaPicker
          onPick={this.handleAlphaPick}
          onTouch={this.handleAlphaTouch}
          height={this.props.ui.innerHeight - this.props.ui.headerHeight - this.props.ui.footerHeight}
          top={this.props.ui.headerHeight}
        />
      </div>
    )
  }

  componentWillUnmount () {
    this.props.scrollArtists(this.lastScrollTop || this.props.scrollTop)
  }

  componentDidUpdate (prevProps) {
    if (!this.list) return

    // @todo: clear size cache starting from the toggled artist
    this.list.resetAfterIndex(0)
  }

  rowRenderer = ({ index, style }) => {
    const { artists, artistsResult, expandedArtists } = this.props
    const artist = artists[artistsResult[index]]

    return (
      <ArtistItem
        artistId={artist.artistId}
        artistSongIds={artist.songIds} // "children"
        filterKeywords={this.props.filterKeywords}
        isExpanded={expandedArtists.includes(artist.artistId)}
        key={artist.artistId}
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

  rowHeight = index => {
    const artistId = this.props.artistsResult[index]
    let rows = 1

    if (this.props.expandedArtists.includes(artistId)) {
      rows += this.props.artists[artistId].songIds.length
    }

    return rows * ROW_HEIGHT
  }

  handleScroll = ({ scrollOffset }) => {
    this.lastScrollTop = scrollOffset
  }

  handleAlphaPick = (char) => {
    const row = this.props.alphaPickerMap[char]

    if (typeof row !== 'undefined') {
      this.list.scrollToItem(row > 0 ? row - 1 : row, 'start')
    }
  }

  handleRef = r => {
    this.list = r
    this.list.scrollTo(this.props.scrollTop)
  }
}

export default ArtistList
