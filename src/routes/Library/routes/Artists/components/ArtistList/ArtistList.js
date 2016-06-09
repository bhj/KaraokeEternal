import React, { PropTypes } from 'react'
import { AutoSizer, VirtualScroll } from 'react-virtualized'
import styles from 'react-virtualized/styles.css'
import ArtistItem from '../ArtistItem'
import SongItem from '../SongItem'

const ROW_HEIGHT = 48

class ArtistList extends React.Component {
  static propTypes = {
    ids: PropTypes.array.isRequired,
    artists: PropTypes.object.isRequired
  }

  VirtualScroll = null
  expandedId = null
  lastStartIndex = null

  rowRenderer = this.rowRenderer.bind(this)
  handleRowsRendered = this.handleRowsRendered.bind(this)
  rowHeight = this.rowHeight.bind(this)

  render () {
    if (!this.props.ids.length) return null

    return (
      <AutoSizer>
        {({ height, width }) => (
          <VirtualScroll
            width={width}
            height={height}
            ref={(c) => {this.VirtualScroll = c}}
            rowCount={this.props.ids.length}
            rowHeight={this.rowHeight}
            rowRenderer={this.rowRenderer}
            onRowsRendered={this.handleRowsRendered}
            scrollToIndex={this.lastStartIndex}
            scrollToAlignment="start"
            overscanRowCount={10}
          />
        )}
      </AutoSizer>
    )
  }

  handleArtistClick(artistId) {
    this.expandedId = (artistId === this.expandedId) ? null : artistId

    this.VirtualScroll.recomputeRowHeights()
    this.VirtualScroll.forceUpdate()
  }

  handleSongClick(uid) {
    console.log(uid)
    // this.VirtualScroll.recomputeRowHeights()
    // this.VirtualScroll.forceUpdate()
  }

  handleRowsRendered({startIndex}) {
    this.lastStartIndex = startIndex
  }

  componentWillUnmount() {
    localStorage.setItem('lastStartIndex', this.lastStartIndex)
  }

  componentWillMount() {
    this.lastStartIndex = localStorage.getItem('lastStartIndex')
  }

  rowRenderer({index}) {
    let artist = this.props.artists[this.props.ids[index]]
    let children = []

    if (this.expandedId === artist.id){
      artist.children.forEach(function(song, i) {
        children.push(
          <SongItem
            key={song.uid}
            title={song.title}
            plays={song.plays}
            onSelectSong={() => this.handleSongClick(song.uid)}
          />
        )
      }, this)
    }

    return (
      <ArtistItem
        key={artist.id}
        name={artist.name}
        count={artist.children.length}
        onArtistSelect={() => this.handleArtistClick(artist.id)}
        isExpanded={artist.id === this.expandedId}
      >
        {children}
      </ArtistItem>
    )
  }

  rowHeight({index}) {
    let rows = 1

    if (this.expandedId === this.props.artists[this.props.ids[index]].id) {
      rows += this.props.artists[this.props.ids[index]].children.length
    }

    return rows * ROW_HEIGHT
  }
}

export default ArtistList
