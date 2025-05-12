import React from 'react'
import clsx from 'clsx'
import styles from './InputCheckbox.css'

interface InputCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (checked: boolean) => void
  label?: string
  className?: string
}

const InputCheckbox = ({
  onChange,
  label,
  className,
  ...rest
}: InputCheckboxProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.checked)
    }
  }

  return (
    <label className={clsx(styles.container, className)}>
      <input
        type='checkbox'
        onChange={handleChange}
        {...rest}
      />
      {label}
    </label>
  )
}

export default InputCheckbox
