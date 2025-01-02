import React, { useCallback, useLayoutEffect, useRef, useState } from 'react'
import Icon from '../Icon/Icon'

interface ButtonProps {
  animateClassName?: string
  children?: React.ReactNode
  className?: string
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
  icon: string
  size: number
}

const Button = ({
  animateClassName,
  icon,
  onClick,
  size,
  ...props
}: ButtonProps) => {
  const [isAnimating, setAnimating] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (isAnimating) ref.current.classList.add(animateClassName)
  }, [animateClassName, props.className, isAnimating])

  const handleAnimationEnd = useCallback(() => {
    ref.current.classList.remove(animateClassName)
    setAnimating(false)
  }, [animateClassName])

  const handleClick = useCallback((e) => {
    if (animateClassName) {
      ref.current.classList.add(animateClassName)
      ref.current.addEventListener('animationend', handleAnimationEnd)
      setAnimating(true)
    }

    if (onClick) onClick(e)
  }, [animateClassName, handleAnimationEnd, onClick])

  return (
    <div
      onClick={handleClick}
      ref={ref}
      {...props}
    >
      <Icon icon={icon} size={size} />
      {props.children}
    </div>
  )
}

export default Button
