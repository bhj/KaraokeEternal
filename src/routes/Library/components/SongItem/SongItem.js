import React from 'react'
import classes from './SongItem.css'

export const SongItem = (props) => (
  <div>
    <div onClick={props.onSelectSong} className={classes.container}>
      <div className={classes.title}>{props.title}</div>
      <div className={classes.plays}>{props.plays}</div>
    </div>
    {props.children}
  </div>
)

SongItem.propTypes = {
  plays: React.PropTypes.number.isRequired,
  title: React.PropTypes.string.isRequired,
  onSelectSong: React.PropTypes.func.isRequired
}

export default SongItem
