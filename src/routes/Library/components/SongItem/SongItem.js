import React, { PropTypes } from 'react'
import classes from './SongItem.css'

export const SongItem = (props) => (
  <div style={props.style} className={classes.container + (props.isQueued ? ' ' + classes.isQueued : '')}>
    <div className={classes.stats}>
      {toMMSS(props.duration)}
    </div>

    <div onClick={props.onSongClick}  className={classes.title}>
      {props.title}
    </div>

    <div onClick={props.onSongStarClick} className={classes.star}>
      <i className='material-icons'>
        {props.isStarred ? 'star' : 'star_border'}
      </i>
    </div>
  </div>
)

SongItem.propTypes = {
  title: PropTypes.string.isRequired,
  duration: PropTypes.number.isRequired,
  stars: PropTypes.number.isRequired,
  provider: PropTypes.string.isRequired,
  style: PropTypes.object,
  onSongClick: PropTypes.func.isRequired,
  onSongStarClick: PropTypes.func.isRequired,
  isQueued: PropTypes.bool.isRequired,
}

export default SongItem

// convert seconds to mm:ss
function toMMSS(duration) {
  const min = Math.floor(duration / 60)
  const sec = duration - (min * 60)
  return min + ':' + (sec < 10 ? '0' + sec : sec)
}
