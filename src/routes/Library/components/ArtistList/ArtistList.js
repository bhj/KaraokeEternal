import PropTypes from 'prop-types'
import React from 'react'
import PaddedList from 'components/PaddedList'
import AlphaPicker from '../AlphaPicker'
import ArtistItem from '../ArtistItem'
const ROW_HEIGHT = 44

class ArtistList extends React.Component {
  static propTypes = {
    artists: PropTypes.object.isRequired, // entities
    artistsResult: PropTypes.array.isRequired, // artistIds
    songs: PropTypes.object.isRequired, // entities
    queuedSongIds: PropTypes.array.isRequired,
    starredSongs: PropTypes.array.isRequired,
    expandedArtists: PropTypes.array.isRequired,
    alphaPickerMap: PropTypes.object.isRequired,
    filterKeywords: PropTypes.array.isRequired,
    scrollTop: PropTypes.number.isRequired,
    ui: PropTypes.object.isRequired,
    // actions
    toggleArtistExpanded: PropTypes.func.isRequired,
    scrollArtists: PropTypes.func.isRequired,
  }

  render () {
    if (this.props.artistsResult.length === 0) return null
    const { ui } = this.props

    return (
      <div>
        <PaddedList
          rowCount={this.props.artistsResult.length}
          rowHeight={this.rowHeight}
          rowRenderer={this.rowRenderer}
          onScroll={this.handleScroll}
          onRef={this.setRef}
          paddingTop={ui.headerHeight}
          paddingBottom={ui.footerHeight}
          width={ui.browserWidth}
          height={ui.browserHeight}
          scrollToAlignment='start'
        />
        <AlphaPicker
          onPick={this.handleAlphaPick}
          onTouch={this.handleAlphaTouch}
          height={ui.viewportHeight - 20}
          top={ui.headerHeight + 10}
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
    // this.list.forceUpdate()
  }

  rowRenderer = ({ index, key, style }) => {
    const { artists, artistsResult, expandedArtists } = this.props
    const artist = artists[artistsResult[index]]

    return (
      <ArtistItem
        songs={this.props.songs}
        artistSongIds={artist.songIds} // "children"
        queuedSongIds={this.props.queuedSongIds}
        starredSongs={this.props.starredSongs}
        name={artist.name}
        isExpanded={expandedArtists.includes(artist.artistId)}
        filterKeywords={this.props.filterKeywords}
        onArtistClick={() => this.props.toggleArtistExpanded(artist.artistId)}
        key={key}
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
    this.list.scrollToRow(row > 0 ? row - 1 : row)
  }

  setRef = (ref) => {
    this.list = ref
    this.list.scrollToPosition(this.props.scrollTop)
  }
}

export default ArtistList
