import React from 'react'
import PropTypes from 'prop-types'
import BodyLock from './BodyLock'
import './AlphaPicker.css'

class AlphaPicker extends React.Component {
  alphabet = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  state = {
    isTouching: false,
    isScrollLocked: false,
    char: null,
    y: null,
  }

  componentDidUpdate (prevProps, prevState) {
    if (this.state.isTouching) {
      clearTimeout(this.timerId)
    }

    if (prevState.isTouching && !this.state.isTouching) {
      // delay scroll unlock
      this.timerId = setTimeout(() => {
        this.setState({ isScrollLocked: false })
      }, 200)
    }
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
        <BodyLock isLocked={this.state.isScrollLocked} />

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
      isScrollLocked: true,
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
