import React, { PropTypes } from 'react'
import PaddedList from 'components/PaddedList'
import ArtistItem from '../ArtistItem'
import SongItem from '../SongItem'

class SearchResults extends React.Component {
  static propTypes = {
    artists: PropTypes.object.isRequired,
    songs: PropTypes.object.isRequired,
    artistResults: PropTypes.array.isRequired,  // artistIds
    songResults: PropTypes.array.isRequired,  // songIds
    // onArtistSelect: PropTypes.func.isRequired
  }

  render () {
    return (
      <PaddedList
        width={this.props.width}
        height={this.props.height}
        paddingTop={this.props.paddingTop}
        paddingBottom={this.props.paddingBottom}
        // songs={this.props.songs.result} // pass-through forces List refresh
        // queuedSongIds={this.props.queuedSongIds} // pass-through forces List refresh
        rowCount={this.props.artistResults+this.props.songResults+2}
        rowHeight={this.rowHeight}
        rowRenderer={this.rowRenderer}
        // onScroll={this.handleScroll}
        onRef={this.setRef}
      />
    )
  }

  //   return (
  //     <div style={{paddingTop: this.props.paddingTop, paddingBottom: this.props.paddingBottom}}>
  //       <p>{this.props.artistResults.length} Artists</p>
  //       {this.props.artistResults.map((artistId) => {
  //         const artist = this.props.artists.entities[artistId]
  //         return (
  //           <ArtistItem
  //             key={artistId}
  //             name={artist.name}
  //             count={artist.songIds.length}
  //             // onArtistSelect={() => this.handleArtistClick(artistId)}
  //             isExpanded={false}
  //             isChildQueued={false}
  //           />
  //         )
  //       })}
  //
  //       <p>{this.props.songResults.length} Songs</p>
  //       {this.props.songResults.map((songId) => {
  //         const song = this.props.songs.entities[songId]
  //         return (
  //           <SongItem
  //             {...song}
  //             key={songId}
  //             // isQueued={false}
  //           />
  //         )
  //       })}
  //     </div>
  //   )
  // }
}

export default SearchResults
