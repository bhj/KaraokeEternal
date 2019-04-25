import PropTypes from 'prop-types'
import React, { Component } from 'react'

export default class ToggleAnimation extends Component {
  static propTypes = {
    toggle: PropTypes.bool.isRequired,
    className: PropTypes.string.isRequired,
    children: PropTypes.node,
  }

  state = {
    animate: false,
  }

  componentDidUpdate (prevProps, prevState) {
    if (this.props.toggle !== prevProps.toggle) {
      this.setState({ animate: true })
    }
  }

  render () {
    const { className, children } = this.props

    // this assumes one child... @todo?
    if (this.state.animate) {
      return React.cloneElement(children, {
        className: children.props.className + ' ' + className,
        onAnimationEnd: this.handleAnimationEnd,
      })
    }

    // don't attach event handler until we really need to
    return children
  }

  handleAnimationEnd = e => this.setState({ animate: false })
}
