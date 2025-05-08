import React, { useCallback, useRef, useState } from 'react'
// depends on styles/global/rc-slider
import Slider, { SliderProps } from 'rc-slider'
import { lockScrolling } from 'store/modules/ui'

interface OptimisticSliderProps {
  className?: string
  handle: SliderProps['handleRender'] // Custom handle render prop
  min: number
  max: number
  onChange: SliderProps['onChange']
  step: number
  value: number
}

const OptimisticSlider = ({
  className,
  handle,
  min,
  max,
  onChange,
  step,
  value,
}: OptimisticSliderProps) => {
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

      if (val !== value) {
        timerId.current = setTimeout(() => {
          setTempVal(null)
        }, 2000)
      }
    },
    [value],
  )

  return (
    <Slider
      className={className}
      handleRender={handle}
      max={max}
      min={min}
      onChangeComplete={handleChangeComplete}
      onChange={handleChange}
      step={step}
      value={tempVal ?? value}
    />
  )
}

export default OptimisticSlider
