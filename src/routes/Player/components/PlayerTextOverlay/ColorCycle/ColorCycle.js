import PropTypes from 'prop-types'
import React from 'react'
import './ColorCycle.css'

const framerate = 33 // ms

class ColorCycle extends React.Component {
  static propTypes = {
    text: PropTypes.string.isRequired,
  }

  shouldComponentUpdate (prevProps) {
    return prevProps.text !== this.props.text
  }

  render () {
    const text = this.props.text.split('').map((char, i) => {
      const delay = (i - this.props.text.length + 1) * framerate

      return (
        <span key={char + i} styleName='char' style={{ animationDelay: `${delay}ms` }}>
          {char}
        </span>
      )
    })

    return (
      <div styleName='container'>
        {text}
      </div>
    )
  }
}

export default ColorCycle
