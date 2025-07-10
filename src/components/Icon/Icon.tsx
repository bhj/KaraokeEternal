import React from 'react'
import icons from './icons'

interface IconProps {
  className?: string
  icon: keyof typeof icons
  size?: number
}

const Icon = (props: IconProps) => {
  const { size, icon, ...restProps } = props

  return (
    <svg
      height={size ? `${size}px` : undefined}
      viewBox={icons[icon].viewBox}
      aria-hidden
      {...restProps}
    >
      <path fill='currentColor' d={icons[icon].d} />
    </svg>
  )
}

export default Icon
