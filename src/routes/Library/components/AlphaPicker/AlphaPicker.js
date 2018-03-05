import React from 'react'
import PropTypes from 'prop-types'
import Popover from './Popover'
import './AlphaPicker.css'

class AlphaPicker extends React.Component {
  alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  state = {
    isPicking: false,
  }

  render () {
    return (
      <div
        styleName='container'
        style={this.props.style}
        onTouchStart={this.handleTouch}
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
        {this.state.isPicking &&
          <Popover y={this.state.y} char={this.state.char} />
        }
      </div>
    )
  }

  handleTouch = (e) => {
    e.preventDefault()

    const parent = this.ref.getBoundingClientRect()
    const charHeight = parent.height / this.alphabet.length
    const y = (e.targetTouches ? e.targetTouches[0].clientY : e.clientY) - parent.top
    const char = this.alphabet[Math.floor(y / charHeight)]

    this.setState({
      isPicking: typeof char !== 'undefined',
      char,
      y,
    })

    this.props.onPick(char)
  }

  handleTouchEnd = (e) => {
    this.setState({
      isPicking: false,
    })
  }

  handleRef = (ref) => {
    this.ref = ref
  }
}

AlphaPicker.propTypes = {
  onPick: PropTypes.func.isRequired,
  style: PropTypes.object,
}

export default AlphaPicker
