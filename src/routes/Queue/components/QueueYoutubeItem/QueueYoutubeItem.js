import PropTypes from 'prop-types'
import React from 'react'
import Buttons from 'components/Buttons'
import Icon from 'components/Icon'
import Swipeable from 'components/Swipeable'
import ToggleAnimation from 'components/ToggleAnimation'
import UserImage from 'components/UserImage'
import styles from './QueueYoutubeItem.css'

class QueueYoutubeItem extends React.Component {
  static propTypes = {
    artist: PropTypes.string.isRequired,
    dateUpdated: PropTypes.number.isRequired,
    errorMessage: PropTypes.string.isRequired,
    isCurrent: PropTypes.bool.isRequired,
    isErrored: PropTypes.bool.isRequired,
    isOwner: PropTypes.bool.isRequired,
    isPlayed: PropTypes.bool.isRequired,
    isRemovable: PropTypes.bool.isRequired,
    isSkippable: PropTypes.bool.isRequired,
    isUpcoming: PropTypes.bool.isRequired,
    pctPlayed: PropTypes.number.isRequired,
    queueId: PropTypes.number.isRequired,
    youtubeVideoId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    userId: PropTypes.number.isRequired,
    userDisplayName: PropTypes.string.isRequired,
    wait: PropTypes.string,
    status: PropTypes.string,
    // actions
    onErrorInfoClick: PropTypes.func.isRequired,
    onRemoveClick: PropTypes.func.isRequired,
    onSkipClick: PropTypes.func.isRequired,
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
              <div className={styles.artist}>
                <div className={styles.artistName}>{props.artist}</div>
                {props.status !== 'ready' &&
                  <div className={styles.status}>{props.status}</div>
                }
              </div>
            </div>
            <div className={`${styles.user} ${props.isOwner ? styles.isOwner : ''}`}>
              {props.userDisplayName}
            </div>
          </div>

          <Buttons btnWidth={50} isExpanded={state.isExpanded}>
            {props.status !== 'ready' &&
              <div>
                <Icon icon='HOURGLASS' size={44} className={`${styles.loader}`} />
              </div>
            }
            {props.isErrored &&
              <div onClick={this.handleErrorInfoClick} className={`${styles.btn} ${styles.danger}`}>
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
    const { isErrored, isRemovable, isSkippable } = this.props

    this.setState({
      isExpanded: isErrored || isRemovable || isSkippable,
    })
  }

  handleSwipedRight = ({ event }) => {
    this.setState({ isExpanded: false })
  }

  handleRemoveClick = () => this.props.onRemoveClick(this.props.queueId)
  handleErrorInfoClick = () => this.props.onErrorInfoClick(this.props.errorMessage)
}

export default QueueYoutubeItem
