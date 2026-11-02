import { useEffect, useRef, useState } from 'react'

// Optimistically reflect a locally-requested value until the authoritative
// value converges (e.g. throttled player status), or the timeout elapses.
export default function useOptimisticValue<T> (value: T, timeout = 2000): [T, (val: T) => void] {
  const [tempValue, setTempValue] = useState<T | null>(null)
  const [prevValue, setPrevValue] = useState<T>(value)
  const timerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // clear the optimistic value once the authoritative value catches up
  if (value !== prevValue) {
    setPrevValue(value)

    if (value === tempValue) {
      setTempValue(null)
    }
  }

  useEffect(() => () => {
    if (timerIdRef.current) clearTimeout(timerIdRef.current)
  }, [])

  const setOptimisticValue = (val: T) => {
    if (timerIdRef.current) clearTimeout(timerIdRef.current)

    // fall back to the authoritative value if it never converges
    timerIdRef.current = setTimeout(() => setTempValue(null), timeout)
    setTempValue(val)
  }

  return [tempValue ?? value, setOptimisticValue]
}
