import PropTypes from 'prop-types'
import React from 'react'
import { CSSTransition } from 'react-transition-group'
import styles from './UpNow.css'

class UpNow extends React.Component {
  static propTypes = {
    text: PropTypes.string.isRequired,
  }

  timeoutID = null
  state = {
    show: false,
  }

  componentDidMount () {
    this.setState({ show: true })

    clearTimeout(this.timeoutID)
    this.timeoutID = setTimeout(() => {
      this.setState({ show: false })
    }, 5000)
  }

  componentWillReceiveProps () {
    this.setState({ show: true })

    clearTimeout(this.timeoutID)
    this.timeoutID = setTimeout(() => {
      this.setState({ show: false })
    }, 5000)
  }

  render () {
    return (
      <CSSTransition
        appear
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
          {this.props.text}
        </div>
      </CSSTransition>
    )
  }
}

export default UpNow
