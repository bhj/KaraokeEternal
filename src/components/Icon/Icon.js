import PropTypes from 'prop-types'
import React from 'react'

const Icon = props => {
  const styles = {
    svg: {
      display: 'inline-block',
      verticalAlign: 'middle',
    },
    path: {
      fill: props.color,
    },
  }

  console.log(props.icon)

  return (
    <svg
      style={styles.svg}
      width={`${props.size}px`}
      height={`${props.size}px`}
      viewBox='0 0 24 24'
    >
      <path
        style={styles.path}
        d={props.icon}
      />
    </svg>
  )
}

Icon.propTypes = {
  icon: PropTypes.string.isRequired,
  size: PropTypes.number,
  color: PropTypes.string,
}

Icon.defaultProps = {
  size: 16,
}

export default Icon
