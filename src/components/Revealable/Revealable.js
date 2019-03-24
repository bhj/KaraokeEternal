/* eslint-disable react/prop-types */
import React from 'react'
import PropTypes from 'prop-types'

export default class Revealable extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    reveal: PropTypes.bool.isRequired,
    maxWidth: PropTypes.number.isRequired,
    minWidth: PropTypes.number.isRequired,
  }

  render () {
    return (
      <div className={this.props.className}
        style={{
          opacity: this.props.reveal ? 1 : 0,
          width: this.props.reveal ? this.props.maxWidth : this.props.minWidth,
        }}>
        {this.props.children}
      </div>
    )
  }
}
