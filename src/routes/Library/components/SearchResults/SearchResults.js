import React, { PropTypes } from 'react'
import PaddedList from 'components/PaddedList'
import ArtistItem from '../ArtistItem'
import SongItem from '../SongItem'
import classes from './SearchResults.css'
const ROW_HEIGHT = 40

class SearchResults extends React.Component {
  static propTypes = {
    artists: PropTypes.object.isRequired,
    songs: PropTypes.object.isRequired,
    artistResults: PropTypes.array.isRequired,  // artistIds
    songResults: PropTypes.array.isRequired,  // songIds
    expandedArtistResults: PropTypes.array.isRequired,
    queuedSongIds: PropTypes.array.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    paddingTop: PropTypes.number.isRequired,
    paddingBottom: PropTypes.number.isRequired,
    // actions
    queueSong: PropTypes.func.isRequired,
    // scrollArtists: PropTypes.func.isRequired,
    toggleArtistResultExpanded: PropTypes.func.isRequired,
  }

  rowRenderer = this.rowRenderer.bind(this)
  rowHeight = this.rowHeight.bind(this)
  handleArtistClick = this.handleArtistClick.bind(this)
  handleSongClick = this.handleSongClick.bind(this)
  // handleScroll = this.handleScroll.bind(this)
  setRef = this.setRef.bind(this)

  componentDidUpdate(prevProps) {
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
        artistResults={this.props.artistResults} // pass-through forces List refresh
        songResults={this.props.songResults} // pass-through forces List refresh
        // queuedSongIds={this.props.queuedSongIds} // pass-through forces List refresh
        rowCount={this.props.artistResults.length+this.props.songResults.length+2}
        rowHeight={this.rowHeight}
        rowRenderer={this.rowRenderer}
        // onScroll={this.handleScroll}
        onRef={this.setRef}
      />
    )
  }

  rowRenderer({index, key, style}) {
    const { artistResults, songResults } = this.props

    // # artist results heading
    if (index === 0) {
      return (
        <div key={key} style={style} className={classes.artistsHeading}>
          {artistResults.length} artists
        </div>
      )
    }

    // artist results
    if (index > 0 && index < artistResults.length+1) {
      const artistId = artistResults[index-1]
      const artist = this.props.artists.entities[artistId]

      return (
        <ArtistItem
          songs={this.props.songs}
          songIds={artist.songIds} // "children"
          queuedSongIds={this.props.queuedSongIds}
          name={artist.name}
          isExpanded={this.props.expandedArtistResults.indexOf(artistId) !== -1}
          onArtistClick={() => this.handleArtistClick(artistId)}
          onSongClick={this.handleSongClick}
          key={key}
          style={style}
        />
      )
    }

    // # song results heading
    if (index === artistResults.length + 1) {
      return (
        <div key={key} style={style} className={classes.songsHeading}>
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
        isQueued={this.props.queuedSongIds.indexOf(songId) !== -1}
      />
    )
  }

  rowHeight({index}) {
    // header
    if (index === 0) return ROW_HEIGHT

    const artistId = this.props.artistResults[index-1]
    let rows = 1

    if (this.props.expandedArtistResults.indexOf(artistId) !== -1) {
      rows += this.props.artists.entities[artistId].songIds.length
    }

    return rows * ROW_HEIGHT
  }

  handleArtistClick(artistId) {
    this.props.toggleArtistResultExpanded(artistId)
  }

  handleSongClick(songId) {
    this.props.queueSong(songId)
  }

  // handleScroll({ scrollTop }) {
  //   this.props.scrollArtists(scrollTop)
  // }

  setRef(ref) {
    this.ref = ref
  }
}

export default SearchResults
