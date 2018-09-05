import PropTypes from 'prop-types'
import React from 'react'
import Icon from 'components/Icon'
import './QueueItem.css'

export const QueueItem = (props) => (
  <div styleName='container' style={{ backgroundSize: props.pctPlayed + '% 100%' }}>
    <div styleName='waitContainer'>
      {props.isActive && 'now'}
      {props.isUpcoming &&
        <div>{props.waitValue}<span styleName='waitUnit'>{props.waitUnit}</span></div>
      }
    </div>

    <div styleName='primary'>
      <div styleName='user'>{props.userDisplayName}</div>
      <div styleName='title'>{props.title}</div>
      <div styleName='artist'>{props.artist}</div>
    </div>

    <div styleName='btnContainer'>
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
  </div>
)

QueueItem.propTypes = {
  title: PropTypes.string.isRequired,
  artist: PropTypes.string.isRequired,
  userDisplayName: PropTypes.string.isRequired,
  waitValue: PropTypes.number.isRequired,
  waitUnit: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  isUpcoming: PropTypes.bool.isRequired,
  pctPlayed: PropTypes.number.isRequired,
  hasErrors: PropTypes.bool.isRequired,
  canSkip: PropTypes.bool.isRequired,
  onSkipClick: PropTypes.func.isRequired,
  canRemove: PropTypes.bool.isRequired,
  onRemoveClick: PropTypes.func.isRequired,
  onErrorInfoClick: PropTypes.func.isRequired,
}

export default QueueItem
