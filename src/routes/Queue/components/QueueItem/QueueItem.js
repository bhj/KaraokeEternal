import PropTypes from 'prop-types'
import React from 'react'
import Icon from 'components/Icon'
import QueueItemImage from './QueueItemImage'
import './QueueItem.css'

export const QueueItem = (props) => (
  <div styleName='container' style={{ backgroundSize: props.pctPlayed + '% 100%' }}>
    <div styleName='innerContainer'>
      <div styleName='imageContainer'>
        <QueueItemImage userId={props.userId} dateUpdated={props.dateUpdated} styleName='image'/>
        <div styleName='waitContainer'>
          {props.isUpcoming &&
            <div styleName='wait'>{props.waitValue}{props.waitUnit}</div>
          }
        </div>
      </div>

      <div styleName={props.isActive ? 'primaryActive' : 'primary'}>
        <div styleName='innerPrimary'>
          <div styleName='title'>{props.title}</div>
          <div styleName='artist'>{props.artist}</div>
        </div>
        <div styleName='user'>{props.userDisplayName}</div>
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
  </div>
)

QueueItem.propTypes = {
  artist: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  userId: PropTypes.number.isRequired,
  userDisplayName: PropTypes.string.isRequired,
  dateUpdated: PropTypes.number.isRequired,
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
