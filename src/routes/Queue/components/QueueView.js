import React, { PropTypes } from 'react'
import Header from 'components/Header'
import SongItem from '../../Library/components/SongItem'

class QueueView extends React.Component {
  static propTypes = {
    uids: PropTypes.array.isRequired,
    songs: PropTypes.object.isRequired,
    errorMessage: PropTypes.string
  }

  handleSongClick = this.handleSongClick.bind(this)

  render() {
    let songs = this.props.uids.map(function(uid, i) {
      let song = this.props.songs[uid]
      return (
        <SongItem
          key={uid}
          title={song.title}
          plays={song.plays}
          onSelectSong={this.handleSongClick}
        />
      )
    }, this)

    return (
      <div>
        <Header title="Queue"/>
        {this.props.errorMessage &&
          <p>{this.props.errorMessage}</p>
        }
        {songs}
      </div>
    )
  }

  handleSongClick() {
    console.log('click')
  }
}

export default QueueView
