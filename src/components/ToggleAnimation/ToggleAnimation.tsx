import React, { Component } from 'react'
import clsx from 'clsx'

interface ToggleAnimationProps {
  toggle: boolean
  className: string
  children?: React.ReactNode
}

export default class ToggleAnimation extends Component<ToggleAnimationProps> {
  state = {
    animate: false,
  }

  componentDidUpdate (prevProps) {
    if (this.props.toggle !== prevProps.toggle) {
      this.setState({ animate: true })
    }
  }

  render () {
    if (this.state.animate) {
      return React.Children.map(this.props.children, (c) => {
        if (React.isValidElement<{ className: string, onAnimationEnd: () => void }>(c)) {
          return React.cloneElement(c, {
            className: clsx(c.props.className, this.props.className),
            onAnimationEnd: this.handleAnimationEnd,
          })
        }
      })
    }

    // don't attach event handler until we really need to
    return this.props.children
  }

  handleAnimationEnd = () => this.setState({ animate: false })
}
