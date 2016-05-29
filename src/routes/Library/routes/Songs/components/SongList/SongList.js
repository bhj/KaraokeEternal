import React, { PropTypes } from 'react'
import SongItem from '../SongItem'

class SongList extends React.Component {
  static propTypes = {
    fetchSongs: PropTypes.func.isRequired,
    songs: PropTypes.object
  }

  render () {
    if (!this.props.songs) return null

    let songs = this.props.songs.map(song => {
      return (
        <SongItem
          title={song.title}
          plays={song.plays}
          onSelectSong={this.handleSongClick.bind(this, song.uid)}
        />
      )
    })

    return (
      <div>
        {songs}
      </div>
    )
  }

  handleSongClick(uid){
    console.log('select', uid)
  }
}

export default SongList
