import PropTypes from 'prop-types'
import React from 'react'
import './SongItem.css'

export const SongItem = (props) => (
  <div style={props.style} styleName={'container' + (props.isQueued ? ' isQueued' : '')}>
    <div styleName='duration'>
      {toMMSS(props.duration)}
    </div>

    <div onClick={props.onSongClick} styleName='title'>
      {props.title} ({props.numMedia})
    </div>

    <div onClick={props.onSongStarClick} styleName={props.isStarred ? 'starStarred' : 'star'}>
      <i className='material-icons' style={{ position: 'absolute' }}>{props.isStarred ? 'star' : 'star_border'}</i>
      <div styleName={props.isStarred ? 'starredCountStarred' : 'starredCount'}>{props.numStars}</div>
    </div>
  </div>
)

SongItem.propTypes = {
  title: PropTypes.string.isRequired,
  duration: PropTypes.number.isRequired,
  style: PropTypes.object,
  onSongClick: PropTypes.func.isRequired,
  onSongStarClick: PropTypes.func.isRequired,
  isQueued: PropTypes.bool.isRequired,
  isStarred: PropTypes.bool.isRequired,
  numStars: PropTypes.number.isRequired,
  numMedia: PropTypes.number.isRequired,
}

export default SongItem

// convert seconds to mm:ss
function toMMSS (duration) {
  const min = Math.floor(duration / 60)
  const sec = duration - (min * 60)
  return min + ':' + (sec < 10 ? '0' + sec : sec)
}
