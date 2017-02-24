import React, { PropTypes } from 'react'
import './ColorCycle.scss'

const ColorCycle = (props) => {
  // add <span>s around each character
  const chars = props.title.split('')
  const text = chars.map(char =>
    <span key={uniqueId()}>{char}</span>
  )

  return (
    <div style={{display: 'flex', height: '100%'}}>
      <div className="anim-text-flow">
        {text}
      </div>
    </div>
  )
}

ColorCycle.PropTypes = {
  title: PropTypes.string.isRequired,
}

export default ColorCycle

// creates a string that can be used for dynamic id attributes
// http://www.frontcoded.com/javascript-create-unique-ids.html
function uniqueId() {
  return 'id-' + Math.random().toString(36).substr(2, 16)
}
