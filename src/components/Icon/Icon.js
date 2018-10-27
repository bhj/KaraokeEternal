import PropTypes from 'prop-types'
import React from 'react'
import icons from './icons'

const Icon = props => {
  const { size, icon, ...restProps } = props

  return (
    <svg
      width={`${size}px`}
      height={`${size}px`}
      viewBox={icons[icon].viewBox}
      {...restProps}
    >
      <path d={icons[icon].d}/>
    </svg>
  )
}

Icon.propTypes = {
  icon: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
}

export default Icon
