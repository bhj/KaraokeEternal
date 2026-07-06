import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

interface UseResizeObserverOptions {
  onResize: (size: { width: number, height: number }) => void
  ref: RefObject<HTMLElement | null>
}

// reports rounded content-box dimensions and skips no-op callbacks,
// matching the behavior of the use-resize-observer package it replaces
const useResizeObserver = ({ onResize, ref }: UseResizeObserverOptions) => {
  const onResizeRef = useRef(onResize)

  useEffect(() => {
    onResizeRef.current = onResize
  }, [onResize])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let prevWidth = -1
    let prevHeight = -1

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width)
      const height = Math.round(entry.contentRect.height)

      if (width !== prevWidth || height !== prevHeight) {
        prevWidth = width
        prevHeight = height
        onResizeRef.current({ width, height })
      }
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
}

export default useResizeObserver
