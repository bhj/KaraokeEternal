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
  lastStartIndex = null
  expandedIds = []

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
    console.log(uid)
    // this.VirtualScroll.recomputeRowHeights()
    // this.VirtualScroll.forceUpdate()
  }

  handleRowsRendered({startIndex}) {
    this.lastStartIndex = startIndex
  }

  componentWillUnmount() {
    localStorage.setItem('lastStartIndex', this.lastStartIndex)
    localStorage.setItem('expandedIds', JSON.stringify(this.expandedIds))
  }

  componentWillMount() {
    this.lastStartIndex = localStorage.getItem('lastStartIndex')
    this.expandedIds = JSON.parse(localStorage.getItem('expandedIds')) || []
  }

  rowRenderer({index}) {
    let artist = this.props.artists[this.props.ids[index]]
    let isExpanded = this.expandedIds.indexOf(artist.id) !== -1
    let children = []

    if (isExpanded){
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
        isExpanded={isExpanded}
      >
        {children}
      </ArtistItem>
    )
  }

  rowHeight({index}) {
    let rows = 1

    if (this.expandedIds.indexOf(this.props.artists[this.props.ids[index]].id) !== -1) {
      rows += this.props.artists[this.props.ids[index]].children.length
    }

    return rows * ROW_HEIGHT
  }
}

export default ArtistList
