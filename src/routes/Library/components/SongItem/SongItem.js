import PropTypes from 'prop-types'
import React from 'react'
import Icon from 'components/Icon'
import './SongItem.css'

export const SongItem = (props) => (
  <div style={props.style} styleName={'container' + (props.isQueued ? ' isQueued' : '')}>
    <div styleName='duration'>
      {toMMSS(props.duration)}
    </div>

    <div onClick={props.onSongClick} styleName='title'>
      {props.title} ({props.numMedia})
    </div>

    <div onClick={props.onSongStarClick}>
      <Icon size={36} icon={props.isStarred ? 'STAR_FULL' : 'STAR_EMPTY'}
        styleName={props.isStarred ? 'starFull' : 'star'}
      />
      <div styleName={props.isStarred ? 'numStarsFull' : 'numStars'}>{props.numStars}</div>
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
