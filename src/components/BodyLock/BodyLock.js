import React from 'react'
import PropTypes from 'prop-types'

class BodyLock extends React.Component {
  static propTypes = {
    lock: PropTypes.bool,
    children: PropTypes.any,
  }
  static defaultProps = {
    lock: false,
  }

  state = {
    isLocked: false,
  }

  componentWillUnmount () {
    clearTimeout(this.timerId)
    document.body.classList.remove('scroll-lock')
  }

  componentDidMount () {
    document.body.classList.toggle('scroll-lock', this.props.lock)
  }

  componentDidUpdate (prevProps) {
    if (this.props.lock) {
      clearTimeout(this.timerId)
      document.body.classList.toggle('scroll-lock', true)
      return
    }

    if (prevProps.lock) {
      // delay scroll unlock
      this.timerId = setTimeout(() => {
        this.setState({ isLocked: false })
      }, 200)
      return
    }

    document.body.classList.toggle('scroll-lock', false)
  }

  render () {
    return this.props.children || null
  }
}

export default BodyLock
