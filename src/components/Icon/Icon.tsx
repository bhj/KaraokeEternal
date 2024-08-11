import React from 'react'
import icons from './icons'

interface IconProps {
  icon: string
  size: number
}

const Icon = (props: IconProps) => {
  const { size, icon, ...restProps } = props

  return (
    <svg
      width={`${size}px`}
      height={`${size}px`}
      viewBox={icons[icon].viewBox}
      {...restProps}
    >
      <path fill='currentColor' d={icons[icon].d}/>
    </svg>
  )
}

export default Icon
