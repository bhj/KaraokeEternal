import React, { PropTypes } from 'react'
import { AutoSizer, List } from 'react-virtualized'
import ArtistItem from '../ArtistItem'
import SongItem from '../SongItem'

const ROW_HEIGHT = 40

class LibraryView extends React.Component {
  static propTypes = {
    artistIds: PropTypes.array.isRequired,
    artists: PropTypes.object.isRequired,
    songIds: PropTypes.array.isRequired,
    songs: PropTypes.object.isRequired,
    queuedSongIds: PropTypes.array.isRequired,
    // actions
    addSong: PropTypes.func.isRequired
  }

  VirtualScroll = null
  expandedIds = []

  rowRenderer = this.rowRenderer.bind(this)
  rowHeight = this.rowHeight.bind(this)

  render () {
    return (
      <AutoSizer>
        {({ height, width }) => (
          <List
            width={width}
            height={height}
            ref={(c) => {this.VirtualScroll = c}}
            queuedSongIds={this.props.queuedSongIds}
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

  handleSongClick(songId) {
    this.props.addSong(songId)
  }

  rowRenderer({index, key, style}) {
    const artist = this.props.artists[this.props.artistIds[index]]
    const isExpanded = this.expandedIds.indexOf(artist.artistId) !== -1

    let children = []
    let isChildQueued = false

    artist.songIds.forEach(songId => {
      let isQueued = false

      // search for id
      if (this.props.queuedSongIds.indexOf(songId) !== -1) {
        isQueued = true
        isChildQueued = true

        if (!isExpanded) {
          // since we aren't rendering children (songs) and
          // we have enough info to render parent ArtistItem
          return
        }
      }

      if (isExpanded) {
        // convert seconds to mm:ss
        const duration = Math.round(this.props.songs[songId].duration)
        const min = Math.floor(duration / 60)
        const sec = duration - (min * 60)

        children.push(
          <SongItem
            key={songId}
            title={this.props.songs[songId].title}
            duration={min + ':' + (sec < 10 ? '0' + sec : sec)}
            plays={this.props.songs[songId].plays}
            provider={this.props.songs[songId].provider}
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
    const artistId = this.props.artistIds[index]
    let rows = 1

    if (this.expandedIds.indexOf(artistId) !== -1) {
      rows += this.props.artists[artistId].songIds.length
    }

    return rows * ROW_HEIGHT
  }
}

export default LibraryView
