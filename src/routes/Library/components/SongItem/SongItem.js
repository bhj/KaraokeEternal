import React, { PropTypes } from 'react'
import classes from './SongItem.css'

export const SongItem = (props) => (
  <div style={props.style} className={classes.container + (props.isQueued ? ' ' + classes.isQueued : '')}>
    <div className={classes.duration}>
      {toMMSS(props.duration)}
    </div>

    <div onClick={props.onSongClick} className={classes.title}>
      {props.title}
    </div>

    <div onClick={props.onSongStarClick} className={props.isStarred ? classes.starStarred : classes.star}>
      <i className='material-icons' style={{ position: 'absolute' }}>{props.isStarred ? 'star' : 'star_border'}</i>
      <div className={props.isStarred ? classes.starredCountStarred : classes.starredCount}>{props.stars}</div>
    </div>
  </div>
)

SongItem.propTypes = {
  title: PropTypes.string.isRequired,
  duration: PropTypes.number.isRequired,
  stars: PropTypes.number.isRequired,
  style: PropTypes.object,
  onSongClick: PropTypes.func.isRequired,
  onSongStarClick: PropTypes.func.isRequired,
  isQueued: PropTypes.bool.isRequired,
  isStarred: PropTypes.bool.isRequired,
}

export default SongItem

// convert seconds to mm:ss
function toMMSS (duration) {
  const min = Math.floor(duration / 60)
  const sec = duration - (min * 60)
  return min + ':' + (sec < 10 ? '0' + sec : sec)
}
