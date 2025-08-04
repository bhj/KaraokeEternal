import React, { CSSProperties } from 'react'
import PaddedList from 'components/PaddedList/PaddedList'
import AlphaPicker from '../AlphaPicker/AlphaPicker'
import ArtistItem from '../ArtistItem/ArtistItem'
import { RootState } from 'store/store'
import { Artist, Song } from 'shared/types'
import { ListOnScrollProps, VariableSizeList } from 'react-window'
const ROW_HEIGHT = 44

interface ArtistListProps {
  alphaPickerMap: Record<string, number>
  artists: Record<number, Artist>
  artistsResult: number[]
  expandedArtists: number[] // artistIds
  filterKeywords: string[]
  queuedSongs: number[] // songIds
  songs: Record<number, Song>
  starredSongs: number[]
  starredArtistCounts: Record<number, number>
  scrollTop: number
  ui: RootState['ui']
  // actions
  toggleArtistExpanded(artistId: number): void
  scrollArtists(scrollTop: number): void
}

class ArtistList extends React.Component<ArtistListProps> {
  lastScrollTop: number | null = null
  list: VariableSizeList | null = null

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
          height={this.props.ui.innerHeight - this.props.ui.headerHeight - this.props.ui.footerHeight}
          top={this.props.ui.headerHeight}
        />
      </div>
    )
  }

  componentWillUnmount () {
    this.props.scrollArtists(this.lastScrollTop || this.props.scrollTop)
  }

  componentDidUpdate () {
    if (!this.list) return

    // @todo: clear size cache starting from the toggled artist
    this.list.resetAfterIndex(0)
  }

  rowRenderer = ({ index, style }: { index: number, style: CSSProperties }) => {
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
        style={style}
      />
    )
  }

  rowHeight = (index: number) => {
    const artistId = this.props.artistsResult[index]
    let rows = 1

    if (this.props.expandedArtists.includes(artistId)) {
      rows += this.props.artists[artistId].songIds.length
    }

    return rows * ROW_HEIGHT
  }

  handleScroll = ({ scrollOffset }: ListOnScrollProps) => {
    this.lastScrollTop = scrollOffset
  }

  handleAlphaPick = (char: string) => {
    const row = this.props.alphaPickerMap[char]

    if (typeof row !== 'undefined') {
      this.list.scrollToItem(row > 0 ? row - 1 : row, 'start')
    }
  }

  handleRef = (r: VariableSizeList) => {
    this.list = r
    this.list.scrollTo(this.props.scrollTop)
  }
}

export default ArtistList
