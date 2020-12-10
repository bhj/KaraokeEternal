import React from 'react'
import PropTypes from 'prop-types'
import { useSwipeable } from 'react-swipeable'

const Swipeable = ({ children, ...props }) => {
  const handlers = useSwipeable(props)

  return (
    <div { ...handlers } className={props.className} style={props.style}>
      {children}
    </div>
  )
}

Swipeable.propTypes = {
  children: PropTypes.any,
  className: PropTypes.string,
  style: PropTypes.object,
}

export default Swipeable
