import React, { PropTypes } from 'react'
import { AutoSizer, VirtualScroll } from 'react-virtualized'
import styles from 'react-virtualized/styles.css'
import ArtistItem from '../ArtistItem'
import SongItem from '../SongItem'

const ROW_HEIGHT = 44

class LibraryView extends React.Component {
  static propTypes = {
    artistIds: PropTypes.array.isRequired,
    artists: PropTypes.object.isRequired,
    songUIDs: PropTypes.array.isRequired,
    songs: PropTypes.object.isRequired,
    queueSong: PropTypes.func.isRequired
  }

  VirtualScroll = null
  expandedIds = []

  rowRenderer = this.rowRenderer.bind(this)
  rowHeight = this.rowHeight.bind(this)

  render () {
    if (!this.props.artistIds.length) return null

    return (
      <AutoSizer>
        {({ height, width }) => (
          <VirtualScroll
            width={width}
            height={height}
            ref={(c) => {this.VirtualScroll = c}}
            rowCount={this.props.artistIds.length}
            rowHeight={this.rowHeight}
            rowRenderer={this.rowRenderer}
            overscanRowCount={10}
          />
        )}
      </AutoSizer>
    )
  }

  handleArtistClick(artistId) {
    let i = this.expandedIds.indexOf(artistId)

    if (i === -1) {
      this.expandedIds.push(artistId)
    } else {
      this.expandedIds.splice(i, 1)
    }

    this.VirtualScroll.recomputeRowHeights()
    this.VirtualScroll.forceUpdate()
  }

  handleSongClick(uid) {
    this.props.queueSong(uid)
  }

  rowRenderer({index}) {
    let artist = this.props.artists[this.props.artistIds[index]]
    let isExpanded = this.expandedIds.indexOf(artist.id) !== -1
    let children = []

    if (isExpanded){
      artist.songs.forEach(function(uid, i) {
        children.push(
          <SongItem
            key={uid}
            title={this.props.songs[uid].title}
            plays={this.props.songs[uid].plays}
            onSelectSong={() => this.handleSongClick(uid)}
          />
        )
      }, this)
    }

    return (
      <ArtistItem
        key={artist.id}
        name={artist.name}
        count={artist.songs.length}
        onArtistSelect={() => this.handleArtistClick(artist.id)}
        isExpanded={isExpanded}
      >
        {children}
      </ArtistItem>
    )
  }

  rowHeight({index}) {
    let rows = 1

    if (this.expandedIds.indexOf(this.props.artists[this.props.artistIds[index]].id) !== -1) {
      rows += this.props.artists[this.props.artistIds[index]].songs.length
    }

    return rows * ROW_HEIGHT
  }
}

export default LibraryView
