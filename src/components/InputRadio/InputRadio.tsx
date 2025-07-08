import React from 'react'
import clsx from 'clsx'
import styles from './InputRadio.css'

interface InputRadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (value: string) => void
  label?: string
  className?: string
}

const InputRadio = ({
  onChange,
  label,
  className,
  ...rest
}: InputRadioProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value)
    }
  }

  return (
    <label className={clsx(styles.container, className)}>
      <input
        type='radio'
        onChange={handleChange}
        {...rest}
      />
      {label}
    </label>
  )
}

export default InputRadio
