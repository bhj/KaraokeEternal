/* eslint-disable react/prop-types */
import React from 'react'
import PropTypes from 'prop-types'
import './Revealable.css'

// leave room for animation overshoot
const MIN_WIDTH = 5

export default class Revealable extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    reveal: PropTypes.bool.isRequired,
    width: PropTypes.number.isRequired,
  }

  render () {
    return (
      <div styleName='container'
        className={this.props.className}
        style={{
          opacity: this.props.reveal ? 1 : 0,
          width: this.props.reveal ? this.props.width : MIN_WIDTH,
          // max-width works around an issue in Safari
          maxWidth: this.props.reveal ? this.props.width : MIN_WIDTH,
        }}>
        {this.props.children}
      </div>
    )
  }
}
