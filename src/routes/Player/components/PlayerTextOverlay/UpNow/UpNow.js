import PropTypes from 'prop-types'
import React from 'react'
import { CSSTransition } from 'react-transition-group'
import UserImage from 'components/UserImage'
import styles from './UpNow.css'

class UpNow extends React.Component {
  static propTypes = {
    queueItem: PropTypes.object.isRequired,
  }

  timeoutID = null
  state = {
    show: false,
  }

  componentDidMount () {
    this.animate()
  }

  componentDidUpdate (prevProps, prevState) {
    if (this.props.queueItem.queueId !== prevProps.queueItem.queueId) {
      this.animate()
    }
  }

  animate () {
    clearTimeout(this.timeoutID)

    this.setState({ show: true })

    this.timeoutID = setTimeout(() => {
      this.setState({ show: false })
    }, 5000)
  }

  render () {
    return (
      <div className={styles.container}>
        <CSSTransition
          unmountOnExit
          in={this.state.show}
          timeout={1000}
          classNames={{
            appear: '',
            appearActive: '',
            enter: styles.fadeEnter,
            enterActive: styles.fadeEnterActive,
            exit: styles.fadeExit,
            exitActive: styles.fadeExitActive,
          }}>
          <div className={styles.textContainer}>
            <UserImage
              userId={this.props.queueItem.userId}
              dateUpdated={this.props.queueItem.dateUpdated}
              className={styles.userImage}
            />
            <div className={styles.user}>
              {this.props.queueItem.userDisplayName}
            </div>
          </div>
        </CSSTransition>
      </div>
    )
  }
}

export default UpNow
