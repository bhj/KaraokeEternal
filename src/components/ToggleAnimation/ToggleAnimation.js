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

    if (this.state.animate) {
      return (
        <div className={className} onAnimationEnd={e => this.setState({ animate: false })}>
          {children}
        </div>
      )
    }

    // don't attach event handler until we really need to
    return <div>{children}</div>
  }
}
