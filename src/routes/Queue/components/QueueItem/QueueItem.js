import PropTypes from 'prop-types'
import React from 'react'
import './QueueItem.css'

export const QueueItem = (props) => (
  <div styleName='container' style={{ ...props.style, backgroundSize: props.pctPlayed + '% 100%' }}>
    <div styleName='wait'>
      {props.isActive && 'now'}
      {props.isUpcoming && secToTime(props.wait)}
    </div>

    <div styleName='primary'>
      <div styleName='user'>{props.name}</div>
      <div styleName='title'>{props.artist} - {props.title}</div>
    </div>

    {props.hasErrors &&
      <div onClick={props.onErrorInfoClick} styleName='errorInfo'>
        <i className='material-icons'>info_outline</i>
      </div>
    }
    {props.canSkip &&
      <div onClick={props.onSkipClick} styleName='skip'>
        <i className='material-icons'>skip_next</i>
      </div>
    }
    {props.canRemove &&
      <div onClick={props.onRemoveClick} styleName='remove'>
        <i className='material-icons'>clear</i>
      </div>
    }
  </div>
)

QueueItem.propTypes = {
  title: PropTypes.string.isRequired,
  artist: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  wait: PropTypes.number.isRequired,
  isActive: PropTypes.bool.isRequired,
  isUpcoming: PropTypes.bool.isRequired,
  pctPlayed: PropTypes.number.isRequired,
  hasErrors: PropTypes.bool.isRequired,
  canSkip: PropTypes.bool.isRequired,
  onSkipClick: PropTypes.func.isRequired,
  canRemove: PropTypes.bool.isRequired,
  onRemoveClick: PropTypes.func.isRequired,
  onErrorInfoClick: PropTypes.func.isRequired,
  style: PropTypes.object.isRequired,
}

export default QueueItem

function secToTime (sec) {
  if (sec >= 60) {
    return Math.round(sec / 60) + 'm'
  } else {
    return Math.floor(sec) + 's'
  }
}
