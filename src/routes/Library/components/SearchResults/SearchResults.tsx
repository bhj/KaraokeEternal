import React, { CSSProperties } from 'react'
import PaddedList from 'components/PaddedList/PaddedList'
import ArtistItem from '../ArtistItem/ArtistItem'
import SongList from '../SongList/SongList'
import { RootState } from 'store/store'
import { Artist, Song } from 'shared/types'
import styles from './SearchResults.css'
import { VariableSizeList } from 'react-window'

const ARTIST_HEADER_HEIGHT = 22
const ARTIST_RESULT_HEIGHT = 44
const SONG_HEADER_HEIGHT = 22
const SONG_RESULT_HEIGHT = 60

interface SearchResultsProps {
  artists: Record<number, Artist>
  artistsResult: number[]
  expandedArtistResults: number[]
  filterKeywords: string[]
  filterStarred: boolean
  queuedSongs: number[]
  songs: Record<number, Song>
  songsResult: number[]
  starredSongs: number[]
  starredArtistCounts: Record<number, number>
  ui: RootState['ui']
  // actions
  toggleArtistResultExpanded(artistId: number): void
}

class SearchResults extends React.Component<SearchResultsProps> {
  list: VariableSizeList | null = null

  componentDidUpdate () {
    if (this.list) {
      // @todo: clear size cache starting from the toggled artist
      this.list.resetAfterIndex(0)
    }
  }

  render () {
    return (
      <PaddedList
        numRows={this.props.artistsResult.length + 3} // both headers + SongList
        rowHeight={this.rowHeight}
        rowRenderer={this.rowRenderer}
        paddingTop={this.props.ui.headerHeight}
        paddingRight={4}
        paddingBottom={this.props.ui.footerHeight}
        width={this.props.ui.innerWidth}
        height={this.props.ui.innerHeight}
        onRef={this.setRef}
      />
    )
  }

  rowRenderer = ({ index, style }: { index: number, style: CSSProperties }) => {
    const { artistsResult, songsResult, filterStarred } = this.props

    // # artist results heading
    if (index === 0) {
      return (
        <div key='artistsHeading' style={style} className={styles.artistsHeading}>
          {artistsResult.length}
          {' '}
          {filterStarred ? 'starred ' : ''}
          {artistsResult.length === 1 ? 'artist' : 'artists'}
        </div>
      )
    }

    // artist results
    if (index > 0 && index < artistsResult.length + 1) {
      const artistId = artistsResult[index - 1]
      const artist = this.props.artists[artistId]

      return (
        <ArtistItem
          artistId={artistId}
          name={artist.name}
          numStars={this.props.starredArtistCounts[artistId] || 0}
          artistSongIds={artist.songIds} // "children"
          queuedSongs={this.props.queuedSongs}
          starredSongs={this.props.starredSongs}
          isExpanded={this.props.expandedArtistResults.includes(artistId)}
          filterKeywords={this.props.filterKeywords}
          onArtistClick={this.props.toggleArtistResultExpanded}
          key={artistId}
          style={style}
        />
      )
    }

    // # song results heading
    if (index === artistsResult.length + 1) {
      return (
        <div key='songsHeading' style={style} className={styles.songsHeading}>
          {songsResult.length}
          {' '}
          {filterStarred ? 'starred ' : ''}
          {songsResult.length === 1 ? 'song' : 'songs'}
        </div>
      )
    }

    // song results
    return (
      <div style={style} key='songs'>
        <SongList
          songIds={songsResult}
          showArtist
          filterKeywords={this.props.filterKeywords}
          queuedSongs={this.props.queuedSongs}
        />
      </div>
    )
  }

  rowHeight = (index: number) => {
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
    return this.props.songsResult.length * SONG_RESULT_HEIGHT
  }

  setRef = (ref: VariableSizeList) => {
    this.list = ref
  }
}

export default SearchResults
