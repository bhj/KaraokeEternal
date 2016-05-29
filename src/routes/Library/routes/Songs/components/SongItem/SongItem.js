import React from 'react'

export const SongItem = (props) => (
  <div onClick={props.onSelectSong}>
    {props.title} ({props.plays})
  </div>
)

SongItem.propTypes = {
  plays: React.PropTypes.number.isRequired,
  title: React.PropTypes.string.isRequired,
  onSelectSong: React.PropTypes.func.isRequired
}

export default SongItem
