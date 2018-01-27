import PropTypes from 'prop-types'
import React from 'react'
import Icon from 'components/Icon'
import secToTxt from 'lib/secToTxt'
import './QueueItem.css'

export const QueueItem = (props) => (
  <div styleName='container' style={{ ...props.style, backgroundSize: props.pctPlayed + '% 100%' }}>
    <div styleName='wait'>
      {props.isActive && 'now'}
      {props.isUpcoming && secToTxt(props.wait)}
    </div>

    <div styleName='primary'>
      <div styleName='user'>{props.username}</div>
      <div styleName='title'>{props.artist} - {props.title}</div>
    </div>

    {props.hasErrors &&
      <div onClick={props.onErrorInfoClick}>
        <Icon icon='INFO_OUTLINE' size={40} styleName='info' />
      </div>
    }
    {props.canSkip &&
      <div onClick={props.onSkipClick}>
        <Icon icon='PLAY_NEXT' size={40} styleName='playNext' />
      </div>
    }
    {props.canRemove &&
      <div onClick={props.onRemoveClick}>
        <Icon icon='CLEAR' size={40} styleName='remove' />
      </div>
    }
  </div>
)

QueueItem.propTypes = {
  title: PropTypes.string.isRequired,
  artist: PropTypes.string.isRequired,
  username: PropTypes.string.isRequired,
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
