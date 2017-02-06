import React from 'react'
import classes from './SongItem.css'

export const SongItem = (props) => (
  <div onClick={props.onSongClick} style={props.style} className={classes.container + (props.isQueued ? ' ' + classes.isQueued : '')}>
    <div className={classes.stats}>
      {toMMSS(props.duration)}
    </div>

    <div className={classes.title}>{props.title}</div>

    <div className={classes.star}>
      <i className='material-icons'>
        {props.isStarred ? 'star' : 'star_border'}
      </i>
    </div>
  </div>
)

SongItem.propTypes = {
  title: React.PropTypes.string.isRequired,
  duration: React.PropTypes.number.isRequired,
  plays: React.PropTypes.number.isRequired,
  provider: React.PropTypes.string.isRequired,
  onSongClick: React.PropTypes.func.isRequired,
}

export default SongItem

// convert seconds to mm:ss
function toMMSS(duration) {
  const min = Math.floor(duration / 60)
  const sec = duration - (min * 60)
  return min + ':' + (sec < 10 ? '0' + sec : sec)
}
