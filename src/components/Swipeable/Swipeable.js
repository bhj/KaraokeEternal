import React from 'react'
import PropTypes from 'prop-types'
import { useSwipeable } from 'react-swipeable'

const Swipeable = React.forwardRef(({ children, ...props }, ref) => {
  const handlers = useSwipeable(props)

  return (
    <div { ...handlers } ref={ref} className={props.className} style={props.style}>
      {children}
    </div>
  )
})

Swipeable.propTypes = {
  children: PropTypes.any,
  className: PropTypes.string,
  style: PropTypes.object,
}

Swipeable.displayName = 'Swipeable'

export default Swipeable
