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
      {props.title}
      {props.numMedia > 1 &&
        <i> ({props.numMedia})</i>
      }
    </div>

    <div onClick={props.onSongMediaClick} styleName='info'>
      <Icon size={32} icon='MORE_HORIZ' styleName='infoIcon' />
    </div>

    <div onClick={props.onSongStarClick} styleName='star'>
      <Icon size={44} icon={props.isStarred ? 'STAR_FULL' : 'STAR_EMPTY'}
        styleName={props.isStarred ? 'starIconFull' : 'starIcon'}
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
