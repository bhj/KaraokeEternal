import PropTypes from 'prop-types'
import React from 'react'
import { CSSTransition } from 'react-transition-group'
import styles from './UpNow.css'

class UpNow extends React.Component {
  static propTypes = {
    children: PropTypes.any,
    queueId: PropTypes.number.isRequired,
  }

  timeoutID = null
  state = {
    show: false,
  }

  componentDidMount () {
    this.animate()
  }

  componentDidUpdate (prevProps, prevState) {
    if (this.props.queueId !== prevProps.queueId) {
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
      <div styleName='styles.container'>
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
          <div className='bg-blur' styleName='styles.textContainer'>
            {this.props.children}
          </div>
        </CSSTransition>
      </div>
    )
  }
}

export default UpNow
