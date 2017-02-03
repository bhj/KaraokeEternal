import React, { PropTypes } from 'react'
import { List } from 'react-virtualized'
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

  render () {
    return (
      <List
        width={this.props.width}
        height={this.props.height}
        ref={(c) => {this.ref = c}}
        songs={this.props.songs.result} // changes will force List re-draw
        queuedSongs={this.props.queuedSongs} // changes will force List re-draw
        rowCount={this.props.artists.result.length + 2} // top & bottom spacer
        rowHeight={this.rowHeight}
        rowRenderer={this.rowRenderer}
        onScroll={this.handleScroll}
        scrollTop={this.props.scrollTop}
        overscanRowCount={10}
      />
    )
  }

  componentDidUpdate(prevProps) {
    if (this.props.paddingTop !== prevProps.paddingTop ||
      this.props.paddingBottom !== prevProps.paddingBottom) {
      this.ref.recomputeRowHeights()
    }
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
    // top & bottom spacer
    if (index === 0 || index === this.props.artists.result.length+1) {
      return (
        <div key={key} style={style}/>
      )
    } else {
      index--
    }

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
    // top & bottom spacer
    if (index === 0) {
      return this.props.paddingTop
    } else if (index === this.props.artists.result.length+1){
      return this.props.paddingBottom
    } else {
      index--
    }

    const artistId = this.props.artists.result[index]
    let rows = 1

    if (this.props.expandedArtists.indexOf(artistId) !== -1) {
      rows += this.props.artists.entities[artistId].songIds.length
    }

    return rows * ROW_HEIGHT
  }
}

export default ArtistList
