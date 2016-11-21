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
        queuedSongs={this.props.queuedSongs}
        rowCount={this.props.artists.result.length + 2} // top & bottom spacer
        rowHeight={this.rowHeight}
        rowRenderer={this.rowRenderer}
        onScroll={this.handleScroll}
        scrollTop={this.props.scrollTop}
        overscanRowCount={10}
      />
    )
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
        // convert seconds to mm:ss
        const duration = Math.round(songs.entities[songId].duration)
        const min = Math.floor(duration / 60)
        const sec = duration - (min * 60)

        children.push(
          <SongItem
            key={songId}
            title={songs.entities[songId].title}
            duration={min + ':' + (sec < 10 ? '0' + sec : sec)}
            plays={songs.entities[songId].plays}
            provider={songs.entities[songId].provider}
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
      return this.props.style.paddingTop
    } else if (index === this.props.artists.result.length+1){
      return this.props.style.paddingBottom
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
