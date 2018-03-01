import PropTypes from 'prop-types'
import React from 'react'
import FireImage from './fire.gif'
import './Fire.css'

export const Fire = (props) => (
  <div styleName='container'>
    <svg styleName='svg' viewBox='0 0 600 300'>
      <pattern
        id='p-fire'
        viewBox='30 100 186 200'
        patternUnits='userSpaceOnUse'
        width='216' height='200'
        x='-70' y='35'>
        <image href={FireImage} width='256' height='300' />
      </pattern>

      <text textAnchor='middle' x='50%' y='50%' dy='.35em' styleName='text'>
        {props.text}
      </text>
    </svg>
  </div>
)

export default Fire

Fire.propTypes = {
  text: PropTypes.string.isRequired,
}
