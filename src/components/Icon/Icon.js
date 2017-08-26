import PropTypes from 'prop-types'
import React from 'react'
import icons from './icons'

const Icon = props => {
  const styles = {
    svg: {
      display: 'block',
      margin: 'auto',
    },
    path: {
      fill: props.color,
    },
  }

  return (
    <svg
      style={styles.svg}
      width={`${props.size}px`}
      height={`${props.size}px`}
      viewBox={icons[props.icon].viewBox}
    >
      <path
        style={styles.path}
        className={props.className}
        d={icons[props.icon].d}
      />
    </svg>
  )
}

Icon.propTypes = {
  icon: PropTypes.string.isRequired,
  size: PropTypes.number,
  color: PropTypes.string,
  className: PropTypes.string,
}

Icon.defaultProps = {
  size: 32,
}

export default Icon
