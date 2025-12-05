import React, { useCallback, useRef, useState } from 'react'
import clsx from 'clsx'
import { lockScrolling } from 'store/modules/ui'
import RCSlider, { SliderProps as RCSliderProps } from 'rc-slider'
import Icon from 'components/Icon/Icon'
import styles from './Slider.css'

interface SliderProps extends RCSliderProps {
  'aria-label'?: string
  'aria-labelledby'?: string
  'className'?: string
  'handle'?: RCSliderProps['handleRender']
  'min': number
  'max': number
  'onChange': RCSliderProps['onChange']
  'step': number
  'value': number
}

interface HandleProps {
  'aria-label'?: string
  'aria-labelledby'?: string
  'className'?: string
}

const Slider = ({
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  className,
  handle,
  min,
  max,
  onChange,
  step,
  value,
  ...rest
}: SliderProps) => {
  const [tempVal, setTempVal] = useState<number | null>(null)
  const timerId = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = useCallback(
    (val: number) => {
      if (timerId.current) {
        clearTimeout(timerId.current)
        timerId.current = null
      }

      lockScrolling(true)
      setTempVal(val)
      onChange(val)
    },
    [onChange],
  )

  const handleChangeComplete = useCallback(
    (val: number) => {
      lockScrolling(false)

      if (val === value) {
        setTempVal(null)
      } else {
        timerId.current = setTimeout(() => {
          setTempVal(null)
        }, 2000)
      }
    },
    [value],
  )

  // slider handle/grabber
  const defaultHandle = useCallback((node: React.ReactElement): React.ReactElement => {
  // rc-slider passes a node (div) to which we add style and children
    return React.cloneElement(node as React.ReactElement<HandleProps>, {
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      'className': styles.handle,
      'onTouchEnd': (e: React.TouchEvent<HTMLDivElement>) => {
        // Prevent focus outline on touch in mobile Safari
        (e.currentTarget as HTMLDivElement).blur()
      },
    }, (
      <Icon icon='CIRCLE' />
    ))
  }, [ariaLabel, ariaLabelledby])

  return (
    <RCSlider
      className={clsx(styles.container, className)}
      handleRender={handle ?? defaultHandle}
      max={max}
      min={min}
      onChangeComplete={handleChangeComplete}
      onChange={handleChange}
      step={step}
      value={tempVal ?? value}
      {...rest}
    />
  )
}

export default Slider
