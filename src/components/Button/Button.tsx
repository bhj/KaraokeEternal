import React, { useRef, useState } from 'react'
import clsx from 'clsx'
import Icon from '../Icon/Icon'
import styles from './Button.css'

type ButtonElementType = 'button' | 'span'

type ButtonBaseProps = {
  animateClassName?: string
  cancelAnimation?: boolean
  children?: React.ReactNode
  className?: string
  icon?: React.ComponentProps<typeof Icon>['icon']
  size?: number
  variant?: 'primary' | 'danger' | 'default'
  as?: ButtonElementType
}

// Create separate props types for button and span
type ButtonSpecificProps = ButtonBaseProps & React.ButtonHTMLAttributes<HTMLButtonElement>
type SpanSpecificProps = ButtonBaseProps & React.HTMLAttributes<HTMLSpanElement>

// Union type for props
type ButtonProps<E extends ButtonElementType = 'button'> = E extends 'button' ? ButtonSpecificProps : SpanSpecificProps

const Button = <E extends ButtonElementType = 'button'>({
  animateClassName,
  cancelAnimation,
  className,
  children,
  icon,
  onClick,
  size,
  variant,
  as,
  ...rest
}: ButtonProps<E>) => {
  const elementRef = useRef<HTMLButtonElement | HTMLSpanElement>(null)
  const [isAnimating, setAnimating] = useState(false)
  const [prevCancelAnimation, setPrevCancelAnimation] = useState(cancelAnimation)
  const ElementType = as || 'button' as E

  if (cancelAnimation !== prevCancelAnimation) {
    setPrevCancelAnimation(cancelAnimation)

    if (cancelAnimation) {
      setAnimating(false)
    }
  }

  const handleAnimationEnd = () => {
    setAnimating(false)
  }

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (animateClassName) {
      setAnimating(true)
    }

    if (onClick) {
      (onClick as React.MouseEventHandler<HTMLElement>)(e)
    }
  }

  const buttonType = ElementType === 'button'
    ? (rest as React.ButtonHTMLAttributes<HTMLButtonElement>).type || 'button'
    : undefined

  const animationProps = animateClassName && isAnimating
    ? {
        className: clsx(styles.container, styles[variant], className, animateClassName),
        onAnimationEnd: handleAnimationEnd,
      }
    : {
        className: clsx(styles.container, styles[variant], className),
      }

  const commonProps = {
    onClick: handleClick,
    ...animationProps,
    ...rest,
  }

  if (ElementType === 'button') {
    return (
      <button
        {...commonProps as React.ButtonHTMLAttributes<HTMLButtonElement>}
        ref={elementRef as React.RefObject<HTMLButtonElement>}
        type={buttonType}
      >
        {icon && <Icon icon={icon} size={size} />}
        {children}
      </button>
    )
  }

  return (
    <span
      {...commonProps as React.HTMLAttributes<HTMLSpanElement>}
      ref={elementRef as React.RefObject<HTMLSpanElement>}
    >
      {icon && <Icon icon={icon} size={size} />}
      {children}
    </span>
  )
}

export default Button
