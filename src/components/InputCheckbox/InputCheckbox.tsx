import React from 'react'
import clsx from 'clsx'
import styles from './InputCheckbox.css'

interface InputCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  className?: string
  ref?: React.Ref<HTMLInputElement>
}

const InputCheckbox = ({
  label,
  className,
  ref,
  ...rest
}: InputCheckboxProps) => {
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
}

export default InputCheckbox
