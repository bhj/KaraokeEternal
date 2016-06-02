import React, { PropTypes } from 'react'
import SongItem from '../SongItem'

class SongList extends React.Component {
  static propTypes = {
    result: PropTypes.array,
    entities: PropTypes.object,
    isFetching: PropTypes.bool.isRequired
  }

  render () {
    if (!this.props.result || this.props.isFetching) return null

    let songs = this.props.result.map(uid => {
      let song = this.props.entities[uid]
      return (
        <SongItem
          title={song.title}
          plays={song.plays}
          onSelectSong={this.handleSongClick.bind(this, uid)}
          key={uid}
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
