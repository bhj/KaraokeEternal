import React from 'react'
import PropTypes from 'prop-types'

class BodyLock extends React.Component {
  static propTypes = {
    isLocked: PropTypes.bool,
    children: PropTypes.any,
  }
  static defaultProps = {
    isLocked: false,
  }
  componentWillUnmount () {
    document.body.classList.remove('scroll-lock')
  }
  componentDidMount () {
    document.body.classList.toggle('scroll-lock', this.props.isLocked)
  }
  componentDidUpdate (prevProps) {
    document.body.classList.toggle('scroll-lock', this.props.isLocked)
  }

  render () {
    return this.props.children || null
  }
}

export default BodyLock
