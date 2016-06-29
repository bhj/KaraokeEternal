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
    queue: PropTypes.object.isRequired,
    // actions
    queueSong: PropTypes.func.isRequired
  }

  VirtualScroll = null
  expandedIds = []

  rowRenderer = this.rowRenderer.bind(this)
  rowHeight = this.rowHeight.bind(this)

  componentDidUpdate () {
    // queue may have changed; update rows
    if (this.VirtualScroll) {
      this.VirtualScroll.forceUpdate()
    }
  }

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
    const artist = this.props.artists[this.props.artistIds[index]]
    const isExpanded = this.expandedIds.indexOf(artist.id) !== -1

    let children = []
    let isChildQueued = false

    for (let i=0; i < artist.songs.length; i++) {
      const uid = artist.songs[i]
      let isQueued = false

      // search for uid
      if (this.props.queue.result.uids.indexOf(uid) !== -1) {
        isQueued = true
        isChildQueued = true

        if (!isExpanded) {
          // since we aren't rendering children (songs) and
          // we have enough info to render parent ArtistItem
          break
        }
      }

      if (isExpanded) {
        children.push(
          <SongItem
            key={uid}
            title={this.props.songs[uid].title}
            plays={this.props.songs[uid].plays}
            provider={this.props.songs[uid].provider}
            onSelectSong={() => this.handleSongClick(uid)}
            isQueued={isQueued}
          />
        )
      }
    }

    return (
      <ArtistItem
        key={artist.id}
        name={artist.name}
        count={artist.songs.length}
        onArtistSelect={() => this.handleArtistClick(artist.id)}
        isExpanded={isExpanded}
        isChildQueued={isChildQueued}
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
