import React, { PropTypes } from 'react'
import chroma from 'chroma-js'
import classes from './ColorCycle.css'

const colorNames = ['red','purple','blue','green', 'yellow','orange','red']
const cycleSpeed = 50 // ms

class ColorCycle extends React.Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
  }

  state = {
    offset: 0,
  }

  chars = []

  render() {
    const text = this.chars.map((char, i) => {
      i += this.state.offset

      if (i >= this.colors.length) {
        i -= this.colors.length
      }

      return (
        <span key={char+i} style={{color: this.colors[i]}}>
          {char}
        </span>
      )
    })

    return (
      <div className={classes.text}>
        {text}
      </div>
    )
  }

  componentDidUpdate(prevProps) {
    if (prevProps.title !== this.props.title) {
      this.updateTitle()
    }
  }

  componentDidMount() {
    this.updateTitle()

    this.timer = setInterval(() => {
      this.setState({
        offset: this.state.offset < this.colors.length ? ++this.state.offset : 0
      })
    }, cycleSpeed)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
  }

  updateTitle = () => {
    // array of chars
    this.chars = this.props.title.split('')

    // array of hex colors spread throughout colorNames
    this.colors = chroma.scale(colorNames)
      .mode('lab')
      .colors(this.chars.length * 10)
  }
}

export default ColorCycle
