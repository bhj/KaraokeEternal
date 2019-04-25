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
    if (this.state.animate) {
      return React.Children.map(this.props.children, c => {
        return React.cloneElement(c, {
          className: c.props.className + ' ' + this.props.className,
          onAnimationEnd: this.handleAnimationEnd,
        })
      })
    }

    // don't attach event handler until we really need to
    return this.props.children
  }

  handleAnimationEnd = e => this.setState({ animate: false })
}
