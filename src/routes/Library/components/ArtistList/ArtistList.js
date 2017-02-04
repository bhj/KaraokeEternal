import React, { PropTypes } from 'react'
import PaddedList from 'components/PaddedList'
import ArtistItem from '../ArtistItem'
import SongItem from '../SongItem'
const ROW_HEIGHT = 40

class ArtistList extends React.Component {
  static propTypes = {
    artists: PropTypes.object.isRequired,
    songs: PropTypes.object.isRequired,
    queuedSongs: PropTypes.array.isRequired,
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
  handleScroll = this.handleScroll.bind(this)
  setRef = this.setRef.bind(this)

  render () {
    if (this.props.artists.result.length === 0) return null

    return (
      <PaddedList
        width={this.props.width}
        height={this.props.height}
        songs={this.props.songs.result} // pass-through forces List refresh
        queuedSongs={this.props.queuedSongs} // pass-through forces List refresh
        rowCount={this.props.artists.result.length}
        rowHeight={this.rowHeight}
        rowRenderer={this.rowRenderer}
        onScroll={this.handleScroll}
        onRef={this.setRef}
        scrollTop={this.props.scrollTop}
        paddingTop={this.props.paddingTop}
        paddingBottom={this.props.paddingBottom}
      />
    )
  }

  setRef(ref) {
    this.ref = ref
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

  rowRenderer({index, key, style}) {
    const { artists, songs } = this.props
    const artist = artists.entities[artists.result[index]]
    const isExpanded = this.props.expandedArtists.indexOf(artist.artistId) !== -1

    let children = []
    let isChildQueued = false

    artist.songIds.forEach(songId => {
      let isQueued = false

      // search for id
      if (this.props.queuedSongs.indexOf(songId) !== -1) {
        isQueued = true
        isChildQueued = true

        if (!isExpanded) {
          // since we aren't rendering children (songs) and
          // we have enough info to render parent ArtistItem
          return
        }
      }

      if (isExpanded) {
        const song = songs.entities[songId]
        children.push(
          <SongItem
            {...song}
            key={songId}
            onSelectSong={() => this.handleSongClick(songId)}
            isQueued={isQueued}
          />
        )
      }
    })

    return (
      <ArtistItem
        key={key}
        style={style}
        name={artist.name}
        count={artist.songIds.length}
        onArtistSelect={() => this.handleArtistClick(artist.artistId)}
        isExpanded={isExpanded}
        isChildQueued={isChildQueued}
      >
        {children}
      </ArtistItem>
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
}

export default ArtistList
