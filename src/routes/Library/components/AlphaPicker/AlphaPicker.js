import React from 'react'
import PropTypes from 'prop-types'
import { lockScrolling } from 'store/modules/ui'
import styles from './AlphaPicker.css'

class AlphaPicker extends React.Component {
  alphabet = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  state = {
    isTouchCapable: false,
    isTouching: false,
    char: null,
    y: null,
  }

  render () {
    return (
      <div
        className={styles.container}
        style={{ height: this.props.height, top: this.props.top }}
        onTouchStart={this.handleTouchStart}
        onTouchMove={this.handleTouch}
        onTouchEnd={this.handleTouchEnd}
        onMouseDown={this.handleTouch}
        onMouseUp={this.handleTouchEnd}
        ref={this.handleRef}
      >
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

  handleTouchStart = (e) => {
    lockScrolling(true)

    this.setState({
      isTouchCapable: true,
      isTouching: true,
    })
  }

  handleTouch = (e) => {
    e.preventDefault()

    if (e.type === 'mousedown' && this.state.isTouchCapable) {
      // browser supports touch events but we got a mouse click;
      // ignore since on touch devices we want to wait for movement
      return
    }

    const y = (e.targetTouches ? e.targetTouches[0].clientY : e.clientY)
    const char = this.alphabet[Math.floor(((y - this.props.top) / this.props.height) * this.alphabet.length)]

    this.setState({
      char,
      y: y - this.props.top,
    })

    // debounce
    if (char !== this.state.char && typeof char !== 'undefined') {
      this.props.onPick(char)
    }
  }

  handleTouchEnd = (e) => {
    lockScrolling(false)

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
