import PropTypes from 'prop-types'
import React from 'react'
import { Swipeable } from 'react-swipeable'
import Icon from 'components/Icon'
import ToggleAnimation from 'components/ToggleAnimation'
import UserImage from 'components/UserImage'
import './QueueItem.css'
const BTN_WIDTH = 50 // larger than the icon

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
    onStarClick: PropTypes.func.isRequired,
  }

  state = {
    isExpanded: false,
  }

  render () {
    const { props, state } = this
    const btnCount = 1 + props.isErrored + props.isSkippable + props.isRemovable
    // if errored we want to show the skip button as well, even when not expanded
    const btnContainerWidth = BTN_WIDTH * (state.isExpanded ? btnCount : props.isErrored && props.isSkippable ? 2 : 1)

    return (
      <Swipeable
        onSwipedLeft={this.handleSwipedLeft}
        onSwipedRight={this.handleSwipedRight}
        preventDefaultTouchmoveEvent
        trackMouse
        style={{ backgroundSize: (props.isActive && props.pctPlayed < 2 ? 2 : props.pctPlayed) + '% 100%' }}
        styleName='container'
      >
        <div styleName='innerContainer'>
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

          <div styleName='btnContainer' style={{ width: btnContainerWidth }}>
            {props.isErrored &&
              <div onClick={this.handleErrorInfoClick} styleName='info'>
                <Icon icon='INFO_OUTLINE' size={40} />
              </div>
            }

            <div onClick={this.handleStarClick} styleName={props.isStarred ? 'starStarred' : 'star'}>
              <ToggleAnimation toggle={props.isStarred} styleName='animateStar'>
                <Icon size={40} icon={'STAR_FULL'}/>
              </ToggleAnimation>
            </div>

            {props.isSkippable &&
              <div onClick={props.onSkipClick}
                styleName={state.isExpanded ? 'btn' : 'btnHidden'}>
                <Icon icon='PLAY_NEXT' size={40} />
              </div>
            }

            {props.isRemovable &&
              <div onClick={this.handleRemoveClick}
                styleName={state.isExpanded ? 'btn' : 'btnHidden'}>
                <Icon icon='CLEAR' size={40} />
              </div>
            }
          </div>
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
  handleRemoveClick = () => this.props.onRemoveClick(this.props.queueId)
  handleErrorInfoClick = () => this.props.onErrorInfoClick(this.props.errorMessage)
}

export default QueueItem
