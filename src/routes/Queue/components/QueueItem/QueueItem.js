import PropTypes from 'prop-types'
import React from 'react'
import Buttons from 'components/Buttons'
import Icon from 'components/Icon'
import Swipeable from 'components/Swipeable'
import ToggleAnimation from 'components/ToggleAnimation'
import UserImage from 'components/UserImage'
import styles from './QueueItem.css'

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
        className={styles.container}
      >
        <div className={styles.content}>
          <div className={`${styles.imageContainer} ${props.isPlayed ? styles.greyed : ''}`}>
            <UserImage userId={props.userId} dateUpdated={props.dateUpdated} height={72} className={styles.image}/>
            <div className={styles.waitContainer}>
              {props.isUpcoming &&
                <div className={`${styles.wait} ${props.isOwner ? styles.isOwner : ''}`}>
                  {props.wait}
                </div>
              }
            </div>
          </div>

          <div className={`${styles.primary} ${props.isPlayed ? styles.greyed : ''}`}>
            <div className={styles.innerPrimary}>
              <div className={styles.title}>{props.title}</div>
              <div className={styles.artist}>{props.artist}</div>
            </div>
            <div className={`${styles.user} ${props.isOwner ? styles.isOwner : ''}`}>
              {props.userDisplayName}
            </div>
          </div>

          <Buttons btnWidth={50} isExpanded={state.isExpanded}>
            {props.isErrored &&
              <div onClick={this.handleErrorInfoClick} className={`${styles.btn} ${styles.danger}`}>
                <Icon icon='INFO_OUTLINE' size={44} />
              </div>
            }
            <div onClick={this.handleStarClick} className={`${styles.btn} ${props.isStarred ? styles.active : ''}`}>
              <ToggleAnimation toggle={props.isStarred} className={styles.animateStar}>
                <Icon size={44} icon={'STAR_FULL'}/>
              </ToggleAnimation>
            </div>
            {props.isInfoable &&
              <div onClick={this.handleInfoClick} className={`${styles.btn} ${styles.active}`} data-hide>
                <Icon icon='INFO_OUTLINE' size={44} />
              </div>
            }
            {props.isRemovable &&
              <div onClick={this.handleRemoveClick} className={`${styles.btn} ${styles.danger}`} data-hide>
                <Icon icon='CLEAR' size={44} />
              </div>
            }
            {props.isSkippable &&
              <div onClick={props.onSkipClick} className={`${styles.btn} ${styles.danger}`} data-hide>
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
