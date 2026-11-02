import React from 'react'
import clsx from 'clsx'
import styles from './Buttons.css'

interface ButtonsProps {
  btnWidth: number
  className?: string
  children?: React.ReactNode
  isExpanded: boolean
}

// children with a data-hide attribute are hidden until expanded (see Buttons.css)
const Buttons = ({ btnWidth, className, children, isExpanded }: ButtonsProps) => (
  <div
    className={clsx(styles.container, className)}
    style={{ '--btn-width': `${btnWidth}px` } as React.CSSProperties}
    {...(isExpanded && { 'data-expanded': '' })}
  >
    {children}
  </div>
)

export default Buttons
