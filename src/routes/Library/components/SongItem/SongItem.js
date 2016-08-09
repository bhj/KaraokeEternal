import React from 'react'
import classes from './SongItem.css'

export const SongItem = (props) => (
  <div onClick={props.onSelectSong} className={classes.container + (props.isQueued ? ' ' + classes.isQueued : '')}>
    <div className={classes.star}>
      <i className='material-icons'>
        {props.isStarred ? 'star' : 'star_border'}
      </i>
    </div>

    <div className={classes.title}>{props.title}</div>

    <div className={classes.stats}>
      {props.duration}
    </div>
  </div>
)

SongItem.propTypes = {
  plays: React.PropTypes.number.isRequired,
  title: React.PropTypes.string.isRequired,
  onSelectSong: React.PropTypes.func.isRequired
}

export default SongItem
