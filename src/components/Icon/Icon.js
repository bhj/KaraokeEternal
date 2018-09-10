import PropTypes from 'prop-types'
import React from 'react'
import icons from './icons'

const Icon = props => {
  const { size, icon, className, ...restProps } = props

  return (
    <svg
      style={{
        display: 'block',
        margin: 'auto',
      }}
      className={className}
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
  size: PropTypes.number,
  className: PropTypes.string,
}

export default Icon
