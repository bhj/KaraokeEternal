import PropTypes from 'prop-types'
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react'
import Icon from '../Icon'

const Button = ({
  animateClassName,
  icon,
  onClick,
  size,
  ...props
}) => {
  const [isAnimating, setAnimating] = useState(false)
  const ref = useRef()

  useLayoutEffect(() => {
    if (isAnimating) ref.current.classList.add(animateClassName)
  }, [animateClassName, props.className, isAnimating])

  const handleAnimationEnd = useCallback(() => {
    ref.current.classList.remove(animateClassName)
    setAnimating(false)
  }, [animateClassName])

  const handleClick = useCallback((...args) => {
    if (animateClassName) {
      ref.current.classList.add(animateClassName)
      ref.current.addEventListener('animationend', handleAnimationEnd)
      setAnimating(true)
    }

    if (onClick) onClick(...args)
  }, [animateClassName, handleAnimationEnd, onClick])

  return (
    <div
      onClick={handleClick}
      ref={ref}
      {...props}
    >
      <Icon icon={icon} size={size}/>
      {props.children}
    </div>
  )
}

Button.propTypes = {
  animateClassName: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
  onClick: PropTypes.func,
  icon: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
}

export default Button
