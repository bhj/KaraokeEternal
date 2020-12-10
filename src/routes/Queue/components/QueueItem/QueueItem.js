import PropTypes from 'prop-types'
import React from 'react'
import Buttons from 'components/Buttons'
import Icon from 'components/Icon'
import Swipeable from 'components/Swipeable'
import ToggleAnimation from 'components/ToggleAnimation'
import UserImage from 'components/UserImage'
import './QueueItem.css'

class QueueItem extends React.Component {
  static propTypes = {
    artist: PropTypes.string.isRequired,
    dateUpdated: PropTypes.number.isRequired,
    errorMessage: PropTypes.string.isRequired,
    isCurrent: PropTypes.bool.isRequired,
    isErrored: PropTypes.bool.isRequired,
    isInfoable: PropTypes.bool.isRequired,
    isOwner: PropTypes.bool.isRequired,
    isPlayed: PropTypes.bool.isRequired,
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
    wait: PropTypes.string,
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
    const { props, state } = this

    return (
      <Swipeable
        onSwipedLeft={this.handleSwipedLeft}
        onSwipedRight={this.handleSwipedRight}
        preventDefaultTouchmoveEvent
        trackMouse
        style={{ backgroundSize: (props.isCurrent && props.pctPlayed < 2 ? 2 : props.pctPlayed) + '% 100%' }}
        styleName='container'
      >
        <div styleName='content'>
          <div styleName={props.isPlayed ? 'imageContainer greyed' : 'imageContainer'}>
            <UserImage userId={props.userId} dateUpdated={props.dateUpdated} height={72} styleName='image'/>
            <div styleName='waitContainer'>
              {props.isUpcoming &&
                <div styleName={props.isOwner ? 'wait isOwner' : 'wait'}>
                  {props.wait}
                </div>
              }
            </div>
          </div>

          <div styleName={props.isPlayed ? 'primary greyed' : 'primary'}>
            <div styleName='innerPrimary'>
              <div styleName='title'>{props.title}</div>
              <div styleName='artist'>{props.artist}</div>
            </div>
            <div styleName={props.isOwner ? 'user isOwner' : 'user'}>
              {props.userDisplayName}
            </div>
          </div>

          <Buttons btnWidth={50} isExpanded={state.isExpanded}>
            {props.isErrored &&
              <div onClick={this.handleErrorInfoClick} styleName='btn danger'>
                <Icon icon='INFO_OUTLINE' size={44} />
              </div>
            }
            <div onClick={this.handleStarClick} styleName={props.isStarred ? 'btn active' : 'btn'}>
              <ToggleAnimation toggle={props.isStarred} styleName='animateStar'>
                <Icon size={44} icon={'STAR_FULL'}/>
              </ToggleAnimation>
            </div>
            {props.isInfoable &&
              <div onClick={this.handleInfoClick} styleName='btn active' data-hide>
                <Icon icon='INFO_OUTLINE' size={44} />
              </div>
            }
            {props.isRemovable &&
              <div onClick={this.handleRemoveClick} styleName='btn danger' data-hide>
                <Icon icon='CLEAR' size={44} />
              </div>
            }
            {props.isSkippable &&
              <div onClick={props.onSkipClick} styleName='btn danger' data-hide>
                <Icon icon='PLAY_NEXT' size={44} />
              </div>
            }
          </Buttons>
        </div>
      </Swipeable>
    )
  }

  handleSwipedLeft = ({ event }) => {
    const { isErrored, isInfoable, isRemovable, isSkippable } = this.props

    this.setState({
      isExpanded: isErrored || isInfoable || isRemovable || isSkippable,
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
