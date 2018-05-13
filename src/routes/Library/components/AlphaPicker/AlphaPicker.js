import React from 'react'
import PropTypes from 'prop-types'
import BodyLock from 'components/BodyLock'
import './AlphaPicker.css'

class AlphaPicker extends React.Component {
  alphabet = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  state = {
    isTouching: false,
    char: null,
    y: null,
  }

  render () {
    return (
      <div
        styleName='container'
        style={{ height: this.props.height, top: this.props.top }}
        onTouchStart={this.handleTouch}
        onTouchMove={this.handleTouch}
        onTouchEnd={this.handleTouchEnd}
        onMouseDown={this.handleTouch}
        onMouseUp={this.handleTouchEnd}
        ref={this.handleRef}
      >
        <BodyLock lock={this.state.isTouching} />

        {this.alphabet.map((char, i) => (
          <div
            key={char}
            style={{ flex: '1 1 auto', minHeight: 0 }}
          >
            {char}
          </div>
        ))}
      </div>
    )
  }

  handleTouch = (e) => {
    e.preventDefault()

    const y = (e.targetTouches ? e.targetTouches[0].clientY : e.clientY)
    const char = this.alphabet[Math.floor(((y - this.props.top) / this.props.height) * this.alphabet.length)]

    this.setState({
      isTouching: true,
      char,
      y: y - this.props.top,
    })

    // debounce
    if (char !== this.state.char && typeof char !== 'undefined') {
      this.props.onPick(char)
    }
  }

  handleTouchEnd = (e) => {
    this.setState({
      isTouching: false,
      char: null,
    })
  }

  handleRef = (ref) => {
    this.ref = ref
  }
}

AlphaPicker.propTypes = {
  onPick: PropTypes.func.isRequired,
  height: PropTypes.number.isRequired,
  top: PropTypes.number.isRequired,
}

export default AlphaPicker
