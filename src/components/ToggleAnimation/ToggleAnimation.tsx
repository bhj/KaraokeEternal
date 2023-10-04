import React, { Component } from 'react'

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

  handleAnimationEnd = () => this.setState({ animate: false })
}
