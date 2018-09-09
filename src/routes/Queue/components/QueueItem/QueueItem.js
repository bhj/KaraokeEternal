import PropTypes from 'prop-types'
import React from 'react'
import Icon from 'components/Icon'
import './QueueItem.css'

export const QueueItem = (props) => (
  <div styleName='container' style={{ backgroundSize: props.pctPlayed + '% 100%' }}>
    <div styleName='waitContainer'>
      {props.isActive && 'now'}
      {props.isUpcoming &&
        <div>{props.waitValue}
          <span styleName={props.isOwner ? 'waitUnit isOwner' : 'waitUnit'}>
            {props.waitUnit}
          </span>
        </div>
      }
    </div>

    <div styleName='primary'>
      <div styleName={props.isOwner ? 'user isOwner' : 'user'}>{props.userDisplayName}</div>
      <div styleName='title'>{props.title}</div>
      <div styleName='artist'>{props.artist}</div>
    </div>

    <div styleName='btnContainer'>
      {props.isErrored &&
        <div onClick={props.onErrorInfoClick}>
          <Icon icon='INFO_OUTLINE' size={40} styleName='info' />
        </div>
      }
      {props.isSkippable &&
        <div onClick={props.onSkipClick}>
          <Icon icon='PLAY_NEXT' size={40} styleName='playNext' />
        </div>
      }
      {props.isRemovable &&
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
  isOwner: PropTypes.bool.isRequired,
  isActive: PropTypes.bool.isRequired,
  isUpcoming: PropTypes.bool.isRequired,
  pctPlayed: PropTypes.number.isRequired,
  isErrored: PropTypes.bool.isRequired,
  isSkippable: PropTypes.bool.isRequired,
  onSkipClick: PropTypes.func.isRequired,
  isRemovable: PropTypes.bool.isRequired,
  onRemoveClick: PropTypes.func.isRequired,
  onErrorInfoClick: PropTypes.func.isRequired,
}

export default QueueItem
