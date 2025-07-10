import React from 'react'
import clsx from 'clsx'
import styles from './ColorCycle.css'

const framerate = 33 // ms

interface ColorCycleProps {
  className?: string
  text: string
  offset?: number
}

class ColorCycle extends React.Component<ColorCycleProps> {
  shouldComponentUpdate (prevProps: ColorCycleProps) {
    return prevProps.text !== this.props.text
  }

  render () {
    // randomly offset the starting color
    // 10,000ms animation @ 33ms per frame is about 300 total frames
    const offset = this.props.offset || Math.random() * -300

    const text = this.props.text.split('').map((char, i) => {
      const delay = (i - this.props.text.length + offset) * framerate

      return (
        <span
          key={this.props.text + i}
          className={styles.char}
          style={{ animationDelay: `${delay}ms` }}
        >
          {char}
        </span>
      )
    })

    return (
      <div className={clsx(styles.container, this.props.className)}>
        {text}
      </div>
    )
  }
}

export default ColorCycle
