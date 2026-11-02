import { useEffect, useRef } from 'react'

interface UseResizeObserverOptions {
  onResize: (size: { width: number, height: number }) => void
  element: HTMLElement | null
}

// reports rounded content-box dimensions and skips no-op callbacks,
// matching the behavior of the use-resize-observer package it replaces.
// takes the element itself (e.g. from a callback ref) so conditionally-rendered
// elements are observed when they mount and report zero size when they unmount
const useResizeObserver = ({ onResize, element }: UseResizeObserverOptions) => {
  const onResizeRef = useRef(onResize)

  useEffect(() => {
    onResizeRef.current = onResize
  }, [onResize])

  useEffect(() => {
    if (!element) {
      onResizeRef.current({ width: 0, height: 0 })
      return
    }

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

    observer.observe(element)
    return () => observer.disconnect()
  }, [element])
}

export default useResizeObserver
