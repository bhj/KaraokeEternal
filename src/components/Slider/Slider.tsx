import React, { useRef, useState } from 'react'
import clsx from 'clsx'
import { lockScrolling } from 'store/modules/ui'
import RCSlider, { SliderProps as RCSliderProps } from 'rc-slider'
import Icon from 'components/Icon/Icon'
import styles from './Slider.css'

interface SliderProps extends RCSliderProps {
  'aria-label'?: string
  'aria-labelledby'?: string
  'className'?: string
  'handleComponent'?: React.ReactElement
  'min': number
  'max': number
  'onChange': RCSliderProps['onChange']
  /** the value once the interaction settles, after any drag */
  'onChangeComplete'?: RCSliderProps['onChangeComplete']
  'step': number
  'value': number
}

interface HandleProps {
  'aria-label'?: string
  'aria-labelledby'?: string
  'className'?: string
  'onTouchEnd'?: React.TouchEventHandler<HTMLDivElement>
}

const Slider = ({
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  className,
  handleComponent,
  min,
  max,
  onChange,
  onChangeComplete,
  step,
  value,
  ...rest
}: SliderProps) => {
  const [tempVal, setTempVal] = useState<number | null>(null)
  const timerId = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = (val: number) => {
    if (timerId.current) {
      clearTimeout(timerId.current)
      timerId.current = null
    }

    lockScrolling(true)
    setTempVal(val)
    onChange(val)
  }

  const handleChangeComplete = (val: number) => {
    lockScrolling(false)

    if (val === value) {
      setTempVal(null)
    } else {
      timerId.current = setTimeout(() => {
        setTempVal(null)
      }, 2000)
    }

    // destructured out of `rest` above: spreading it onto RCSlider would replace
    // this handler and with it the scroll lock and temp value cleanup
    onChangeComplete?.(val)
  }

  // slider handle/grabber
  const defaultHandle = (node: React.ReactElement): React.ReactElement => {
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
      handleComponent ?? <Icon icon='CIRCLE' />
    ))
  }

  return (
    <RCSlider
      className={clsx(styles.container, className)}
      handleRender={defaultHandle}
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
