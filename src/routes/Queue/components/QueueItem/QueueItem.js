import PropTypes from 'prop-types'
import React from 'react'
import { Swipeable } from 'react-swipeable'
import Icon from 'components/Icon'
import ToggleAnimation from 'components/ToggleAnimation'
import UserImage from 'components/UserImage'
import Revealable from 'components/Revealable'
import './QueueItem.css'
const BTN_WIDTH = 45 // larger than the icon

class QueueItem extends React.Component {
  static propTypes = {
    artist: PropTypes.string.isRequired,
    dateUpdated: PropTypes.number.isRequired,
    errorMessage: PropTypes.string.isRequired,
    isActive: PropTypes.bool.isRequired,
    isErrored: PropTypes.bool.isRequired,
    isOwner: PropTypes.bool.isRequired,
    isRemovable: PropTypes.bool.isRequired,
    isSkippable: PropTypes.bool.isRequired,
    isStarred: PropTypes.bool.isRequired,
    isUpcoming: PropTypes.bool.isRequired,
    pctPlayed: PropTypes.number.isRequired,
    queueId: PropTypes.number.isRequired,
    songId: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    userId: PropTypes.number.isRequired,
    userDisplayName: PropTypes.string.isRequired,
    waitValue: PropTypes.number.isRequired,
    waitUnit: PropTypes.string.isRequired,
    // actions
    onErrorInfoClick: PropTypes.func.isRequired,
    onRemoveClick: PropTypes.func.isRequired,
    onSkipClick: PropTypes.func.isRequired,
    onInfoClick: PropTypes.func.isRequired,
    onStarClick: PropTypes.func.isRequired,
  }

  state = {
    isExpanded: false,
  }

  render () {
    const { props } = this

    return (
      <Swipeable
        onSwipedLeft={this.handleSwipedLeft}
        onSwipedRight={this.handleSwipedRight}
        preventDefaultTouchmoveEvent
        trackMouse
        style={{ backgroundSize: (props.isActive && props.pctPlayed < 2 ? 2 : props.pctPlayed) + '% 100%' }}
        styleName='container'
      >
        <div styleName='content'>
          <div styleName='imageContainer'>
            <UserImage userId={props.userId} dateUpdated={props.dateUpdated} height={60} styleName='image'/>
            <div styleName='waitContainer'>
              {props.isUpcoming &&
                <div styleName={props.isOwner ? 'wait isOwner' : 'wait'}>
                  {props.waitValue}{props.waitUnit}
                </div>
              }
            </div>
          </div>

          <div styleName={props.isActive ? 'primaryActive' : 'primary'}>
            <div styleName='innerPrimary'>
              <div styleName='title'>{props.title}</div>
              <div styleName='artist'>{props.artist}</div>
            </div>
            <div styleName={props.isOwner ? 'user isOwner' : 'user'}>
              {props.userDisplayName}
            </div>
          </div>

          <div styleName='btnContainer'>
            {props.isErrored &&
              <div onClick={this.handleErrorInfoClick} styleName='btnDanger'>
                <Icon icon='INFO_OUTLINE' size={40} />
              </div>
            }
            <div onClick={this.handleStarClick} styleName={props.isStarred ? 'btnActive' : 'btn'}>
              <ToggleAnimation toggle={props.isStarred} styleName='animateStar'>
                <Icon size={40} icon={'STAR_FULL'}/>
              </ToggleAnimation>
            </div>
          </div>

          <Revealable styleName='btnContainer'
            reveal={this.state.isExpanded}
            maxWidth={BTN_WIDTH * (1 + props.isRemovable + props.isSkippable)}
            minWidth={5} // leave room for animation overshoot
          >
            <div onClick={this.handleInfoClick} styleName='btnActive'>
              <Icon icon='INFO_OUTLINE' size={40} />
            </div>
            {props.isRemovable &&
              <div onClick={this.handleRemoveClick} styleName='btnDanger'>
                <Icon icon='CLEAR' size={40} />
              </div>
            }
            {props.isSkippable &&
              <div onClick={props.onSkipClick} styleName='btnDanger'>
                <Icon icon='PLAY_NEXT' size={40} />
              </div>
            }
          </Revealable>
        </div>
      </Swipeable>
    )
  }

  handleSwipedLeft = ({ event }) => {
    this.setState({
      isExpanded: this.props.isErrored || this.props.isSkippable || this.props.isRemovable,
    })
  }

  handleSwipedRight = ({ event }) => {
    this.setState({ isExpanded: false })
  }

  handleStarClick = () => this.props.onStarClick(this.props.songId)
  handleInfoClick = () => this.props.onInfoClick(this.props.songId)
  handleRemoveClick = () => this.props.onRemoveClick(this.props.queueId)
  handleErrorInfoClick = () => this.props.onErrorInfoClick(this.props.errorMessage)
}

export default QueueItem
