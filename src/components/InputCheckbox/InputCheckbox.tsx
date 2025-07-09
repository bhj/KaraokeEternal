import React, { forwardRef } from 'react'
import clsx from 'clsx'
import styles from './InputCheckbox.css'

interface InputCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  className?: string
}

const InputCheckbox = forwardRef<HTMLInputElement, InputCheckboxProps>(({
  label,
  className,
  ...rest
}, ref) => {
  return (
    <label className={clsx(styles.container, className)}>
      <input
        type='checkbox'
        ref={ref}
        {...rest}
      />
      {label}
    </label>
  )
})

InputCheckbox.displayName = 'InputCheckbox'

export default InputCheckbox
